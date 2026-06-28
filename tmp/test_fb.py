import sys
import os
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.fallback_plans import _build_layout
import json

def test():
    # 15m wide, 7m deep
    res = _build_layout(
        building_w=15.0,
        building_h=7.0,
        bedrooms=2,
        bathrooms=2,
        kitchens=1,
        living_rooms=1,
        balconies=1,
        prompt="add a pooja room"
    )
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test()
