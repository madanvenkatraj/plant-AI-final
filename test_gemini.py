import os
# pyrefly: ignore [missing-import]
from google import genai

key = "AIzaSyBPcpxE_X34q6aGM0owRXJQ-tbdcVtXhyw"
client = genai.Client(api_key=key)

print("Listing models:")
for m in client.models.list():
    print(m.name)
