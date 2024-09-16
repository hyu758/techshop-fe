from enum import Enum

class orderItemStatus(Enum):
    ONCART = 'on_cart'
    PENDING = 'pending'
    SHIPPED = 'shipped'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'