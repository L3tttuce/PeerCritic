import asyncio
import httpx
import time

LOGIN_URL = "http://localhost:8000/login"

USERS = [
    {"username": "Winner", "password": "123456"},
    {"username": "Dough", "password": "123456"},
    {"username": "TheDeep", "password": "123456"},
    {"username": "Luminosity", "password": "123456"},
    {"username": ":3", "password": "123456"},
    {"username": "Barb", "password": "123456"},
    {"username": "SpeedDemon", "password": "123456"},
    {"username": "quynhle", "password": "123456"},
    {"username": "Hellomiku", "password": "123456"},
    {"username": "JustinFlash", "password": "123456"},

    {"username": "FatChungus", "password": "123456"},
    {"username": "BillyButcher", "password": "123456"},
    {"username": "HotCheetoDust", "password": "123456"},
    {"username": "Scared4Life", "password": "123456"},
    {"username": "DoritoDust", "password": "123456"},
    {"username": "BrownFox", "password": "123456"},
    {"username": "MythicalMcChicken", "password": "123456"},
    {"username": "WallBreaker", "password": "123456"},
    {"username": "SheepSpeaker", "password": "123456"},
    {"username": "MarysLamb", "password": "123456"},
]

TOKENS = {}

semaphore = asyncio.Semaphore(5)


async def login_user(client: httpx.AsyncClient, user: dict):
    async with semaphore:
        start = time.perf_counter()

        try:
            response = await client.post(
                LOGIN_URL,
                data={
                    "username": user["username"],
                    "password": user["password"],
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30,
            )

            elapsed = time.perf_counter() - start

            if response.status_code == 200:
                token = response.json().get("access_token")
                TOKENS[user["username"]] = token
                print(f"{user['username']} logged in successfully in {elapsed:.2f}s")
            else:
                print(
                    f"{user['username']} failed with status {response.status_code} "
                    f"in {elapsed:.2f}s: {response.text}"
                )

        except Exception as e:
            elapsed = time.perf_counter() - start
            print(f"{user['username']} error after {elapsed:.2f}s: {type(e).__name__}: {e}")


async def main():
    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[login_user(client, u) for u in USERS])


if __name__ == "__main__":
    asyncio.run(main())