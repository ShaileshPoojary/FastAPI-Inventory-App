from pydantic import BaseModel, ConfigDict, Field

class ProductBase(BaseModel):
    name: str
    description: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)

class ProductCreate(ProductBase):
    id: int = Field(ge=0)

class ProductUpdate(ProductBase):
    model_config = ConfigDict(extra="forbid")

class ProductRead(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductDeleteResponse(BaseModel):
    detail: str


