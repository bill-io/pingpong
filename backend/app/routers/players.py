from typing import List
import csv, io 

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas


router = APIRouter(prefix="/players", tags=["players"]) #endpoint /players
MAX_BULK_IMPORT_ROWS = 200 # to prevent abuse

@router.get("", response_model=List[schemas.PlayerOut])
def list_players(db: Session = Depends(get_db)):
    return db.query(models.Player).order_by(models.Player.created_at.desc()).all() #list all players ordered by created_at desc

@router.get("/{phone_number}", response_model=schemas.PlayerOut) #get player by phone number
def get_player(phone_number: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.phone_number == phone_number).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("", response_model=schemas.PlayerOut, status_code=201) #create a new player
def create_player(payload: schemas.PlayerCreate, db: Session = Depends(get_db)):
    existsing_player= db.query(models.Player).filter(models.Player.phone_number==payload.phone_number).first()
    if existsing_player:
        raise HTTPException(status_code=400 , detail="This phone number already exists in the Player database")
    player=models.Player(
        full_name=payload.full_name,
        phone_number=payload.phone_number
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player

@router.post("/import-csv", response_model=schemas.BulkImportResult) #bulk import players from csv file
async def import_players_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
     CSV columns: full_name,phone_number
    """
    #READ FILE CONTENT
    raw = await file.read()
    try:
        text=raw.decode("utf-8") 
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Could not decode the uploaded file. Please make sure it is a valid UTF-8 encoded CSV file.")

    reader=csv.DictReader(io.StringIO(text))
    required_columns={"full_name","phone_number"}
    if not required_columns.issubset(reader.fieldnames):
        raise HTTPException(status_code=400, detail=f"Invalid CSV file. The following columns are required: {', '.join(required_columns)}")
    
    #Preload existing phone numbers to minimize db queries
    existing_phone_numbers={pn for (pn,) in db.query(models.Player.phone_number).all() if pn}
    
    created_count=0
    errors: List[str]= []
    total=0

    for row in reader:
        if total >= MAX_BULK_IMPORT_ROWS:
            errors.append(f"Maximum limit of {MAX_BULK_IMPORT_ROWS} rows reached. Some rows were not processed.")
            break

        total +=1
        full_name=row.get("full_name","").strip()
        phone_number=row.get("phone_number","").strip() or None

        if not full_name:
            errors.append(f"Row {total}: full_name is required.")
            continue
        if phone_number and phone_number in existing_phone_numbers:
            errors.append(f"Row {total}: phone_number '{phone_number}' already exists.")
            continue
        
        player=models.Player(
            full_name=full_name,
            phone_number=phone_number
        )
        db.add(player)
        try:
            db.commit()
            created_count +=1
            if phone_number:
                existing_phone_numbers.add(phone_number)
        except Exception as e:
            db.rollback()
            errors.append(f"Row {total}: Database error: {str(e)}")
        
        return schemas.BulkImportResult(
            total_rows=total,
            created=created_count,
            skipped=total - created_count,
            errors=errors
        )

#------------Alter Player----------------
#alter phone number
@router.put("/{phone_number}", response_model=schemas.PlayerOut)
def update_player(phone_number: str, payload: schemas.PlayerCreate, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.phone_number == phone_number).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found with that number")
    
    if payload.phone_number != phone_number:
        # Check for uniqueness of new phone number
        existing_player = db.query(models.Player).filter(models.Player.phone_number == payload.phone_number).first()
        if existing_player:
            raise HTTPException(status_code=400, detail="This new phone number already exists in the Player database")
    
    player.phone_number = payload.phone_number
    db.commit()
    db.refresh(player)
    return player

#------------DELETE PLAYER/S----------------
@router.delete("/{phone_number}", status_code=204)
def delete_player(phone_number: str, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found with that number")
    db.delete(player)
    db.commit()
    return

@router.delete("", status_code=204)
def delete_all_players(db: Session = Depends(get_db)):
    db.query(models.Player).delete(synchronize_session=False)
    db.commit()
    return
