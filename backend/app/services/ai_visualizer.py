import random

class AIVisualizer:
    def __init__(self):
        # Cinematic Keywords for Unsplash
        self.themes = {
            "beach": ["sunrise ocean", "tropical palm", "luxury resort pool", "golden hour beach", "underwater coral", "surfing waves"],
            "mountain": ["misty mountains", "snowy peak", "cozy cabin fireplace", "pine forest road", "hiking trail view", "starry night sky"],
            "city": ["city skyline night", "busy street food", "modern architecture", "rooftop bar", "historic monument", "neon street"],
            "historic": ["ancient ruins", "museum interior", "old stone castle", "cobblestone street", "intricate carvings", "sunset temple"],
            "adventure": ["rock climbing", "jungle waterfall", "dirt bike trail", "kayaking river", "camping tent view", "cliff jumping"]
        }
        
    def generate_script(self, destination: str, trip_type: str = "leisure") -> list:
        """
        Generates a 5-scene visual script for the given destination.
        """
        # Clean destination (remove numbers, "trip", "days", etc.)
        ignore_words = ["trip", "beach", "mountain", "city", "visit", "tour", "day", "days", "of", "to", "holiday", "vacation"]
        clean_dest = destination.lower()
        for word in ignore_words:
            clean_dest = clean_dest.replace(word, "")
        clean_dest = ''.join([i for i in clean_dest if not i.isdigit()]).strip()
        if not clean_dest: clean_dest = destination # Fallback if empty
        
        dest_lower = destination.lower()
        theme = "city" # Default
        
        # Simple NLP for context detection
        if any(w in dest_lower for w in ["beach", "goa", "maldives", "bali", "hawaii", "island"]):
            theme = "beach"
        elif any(w in dest_lower for w in ["mountain", "himalaya", "manali", "swiss", "alps", "hill"]):
            theme = "mountain"
        elif any(w in dest_lower for w in ["museum", "rome", "egypt", "hampi", "temple", "agra"]):
            theme = "historic"
        elif any(w in dest_lower for w in ["trek", "camp", "forest", "safari", "wild"]):
            theme = "adventure"
            
        script = []
        
        # Scene 1: The Arrival / Establishing Shot
        script.append({
            "scene_id": 1,
            "keyword": f"{clean_dest} {self.get_keyword(theme)}",
            "caption": f"Welcome to {destination}. Your journey begins here.",
            "mood": "Anticipation",
            "duration": 5000,
            "theme": theme
        })
        
        # Scene 2: The Action / Activity
        script.append({
            "scene_id": 2,
            "keyword": f"{clean_dest} {self.get_keyword(theme)}",
            "caption": "Immerse yourself in the local vibes.",
            "mood": "Excitement",
            "duration": 4000,
            "theme": theme
        })
         
        # Scene 3: The Detail / Close-up
        script.append({
            "scene_id": 3,
            "keyword": f"{clean_dest} food local",
            "caption": "Savor the flavors of the region.",
            "mood": "Sensory",
            "duration": 4000,
            "theme": theme
        })
        
        # Scene 4: The Relax / Vibe
        script.append({
            "scene_id": 4,
            "keyword": f"{clean_dest} {self.get_keyword(theme)}",
            "caption": "Unwind and find your inner peace.",
            "mood": "Relaxation",
            "duration": 5000,
            "theme": theme
        })
        
        # Scene 5: The Departure / Sunset
        script.append({
            "scene_id": 5,
            "keyword": f"{clean_dest} sunset",
            "caption": "Memories that will last a lifetime.",
            "mood": "Nostalgia",
            "duration": 6000,
            "theme": theme
        })
        
        return script

    def get_keyword(self, theme):
        return random.choice(self.themes.get(theme, self.themes["city"]))

visualizer = AIVisualizer()
