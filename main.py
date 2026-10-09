from fastapi import FastAPI,Depends,HTTPException,status
from fastapi.middleware.cors import CORSMiddleware
from schemas import ProductCreate, ProductDeleteResponse, ProductRead, ProductUpdate
from database import session,engine
import database_models
from sqlalchemy.orm import Session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"]
)

database_models.Base.metadata.create_all(bind=engine)


@app.get("/")
def greet():
    return "welcome"

products =[
    ProductCreate(id=1,name="phone",description="budget phone",price = 299.99,quantity=10),
    ProductCreate(id=2,name="laptop",description="A powerful laptop",price = 999.99,quantity=30),
    ProductCreate(id=3,name="Pen",description="A blue ink pen",price = 1.99,quantity=100),
    ProductCreate(id=4,name="cap",description="A black cap",price = 19.99,quantity=20),
    ProductCreate(id=5,name="Table",description="A wooden Table",price = 199.99,quantity=30),
]

def get_db():
    db=session()
    try:
        yield db
    finally:
        db.close()


# Undo the comment only if you need some example data for the database.
# def init_db():
#     db = session()
#     try:
#         count = db.query(database_models.Product).count()

#         if count == 0:
#             for product in products:
#                 db.add(database_models.Product(**product.model_dump()))
#             db.commit()
#     finally:
#         db.close()
# init_db()

@app.get("/products", response_model=list[ProductRead])
def get_all_products(db: Session = Depends(get_db)):

    db_products = db.query(database_models.Product).all()

    return db_products

@app.get("/products/{id}", response_model=ProductRead)
def get_product_by_id(id:int,db:Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Product id {id} was not found")
    return db_product

@app.post("/products", status_code=status.HTTP_201_CREATED, response_model=ProductRead)
def add_product(product:ProductCreate, db: Session = Depends(get_db)):
    existing_product = db.query(database_models.Product).filter(
        database_models.Product.id == product.id
    ).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product id {product.id} already exists",
        )
    db_product = database_models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{id}", response_model=ProductRead)
def update_product(id:int,product:ProductUpdate,db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product == None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.name=product.name
    db_product.description=product.description
    db_product.price= product.price
    db_product.quantity=product.quantity
    db.commit()
    db.refresh(db_product)

    return db_product

@app.delete("/products/{id}", response_model=ProductDeleteResponse)
def delete_product(id:int,db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"detail":"product deleted Successfully"}
    

