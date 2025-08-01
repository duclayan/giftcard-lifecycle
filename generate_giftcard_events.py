import json
import random
from datetime import datetime, timedelta

channels = ["Online", "In-Store", "Retailer", "Mobile App"]
locations = ["New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA", "Phoenix, USA", "Philadelphia, USA", "San Antonio, USA", "San Diego, USA", "Dallas, USA", "San Jose, USA", "Austin, USA", "Jacksonville, USA", "Fort Worth, USA", "Columbus, USA", "Charlotte, USA", "San Francisco, USA", "Indianapolis, USA", "Seattle, USA", "Denver, USA", "Washington, USA"]
event_types = ["Issuance", "Redemption", "RedemptionAttempt", "Cancellation", "Expiration", "BalanceInquiry"]
error_codes = [None, None, None, "INVALID_PIN", "CARD_NOT_FOUND", "EXPIRED"]

num_giftcards = 20
num_events = 200
start_time = datetime(2025, 7, 31, 9, 0, 0)

events = []
event_id = 1
for card_id in range(1, num_giftcards + 1):
    card_events = random.randint(8, 12)
    last_balance = random.randint(50, 200)
    time = start_time + timedelta(minutes=card_id * 5)
    for _ in range(card_events):
        etype = random.choice(event_types)
        error = random.choice(error_codes) if "Attempt" in etype or etype in ["RedemptionAttempt", "Expiration"] else None
        ip = f"192.168.1.{card_id}"
        geo = random.choice(locations)
        amount = 0.0
        if etype == "Issuance":
            amount = last_balance
        elif etype == "Redemption":
            amount = round(random.uniform(10, last_balance), 2)
            last_balance -= amount
        elif etype == "BalanceInquiry":
            amount = last_balance
        event = {
            "EventID": event_id,
            "GiftCardID": card_id,
            "EventType": etype,
            "EventDate": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "ErrorCode": error,
            "IPAddress": ip,
            "GeoLocation": geo,
            "Amount": round(amount, 2)
        }
        events.append(event)
        event_id += 1
        time += timedelta(minutes=random.randint(1, 10))
        if len(events) >= num_events:
            break
    if len(events) >= num_events:
        break

with open("src/data/GiftCardEvents.json", "w") as f:
    json.dump(events, f, indent=2)
print(f"Generated {len(events)} events for {num_giftcards} gift cards.")
