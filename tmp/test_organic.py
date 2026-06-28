import os, sys, json
from dotenv import load_dotenv
load_dotenv()

# Add parent dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.generator import generate_plan
from backend.app.models import Constraints

def test():
    c = Constraints(
        width=15, 
        length=7, 
        bedrooms=2, 
        bathrooms=2, 
        kitchens=1, 
        livingRooms=1, 
        balconies=1,
        stylePreference="modern",
        prompt="I want a spacious layout where the two bedrooms are NOT side-by-side. Put them on opposite ends if possible."
    )
    
    print("🚀 Generating organic plan...")
    plan = generate_plan(c)
    
    print("\n🏠 Plan Result:")
    for r in plan.rooms:
        print(f" - {r.label:15}: ({r.p1.x}, {r.p1.y}) to ({r.p2.x}, {r.p2.y})  [{r.metadata.get('type')}]")

if __name__ == "__main__":
    test()
