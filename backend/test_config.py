# import pymysql

# print("Testing MySQL connection...")
# print()

# try:
#     # Try to connect
#     connection = pymysql.connect(
#         host='localhost',
#         user='root',
#         password='Pass@123',  # Change if your password is different
#         database='qrlms',
#         port=3306
#     )
    
#     print("✅ Connected to MySQL successfully!")
    
#     # Try a simple query
#     cursor = connection.cursor()
#     cursor.execute("SELECT DATABASE()")
#     db_name = cursor.fetchone()
    
#     print(f"✅ Current database: {db_name[0]}")
    
#     # Show tables
#     cursor.execute("SHOW TABLES")
#     tables = cursor.fetchall()
    
#     if tables:
#         print(f"✅ Found {len(tables)} tables:")
#         for table in tables:
#             print(f"   - {table[0]}")
#     else:
#         print("⚠️ No tables found (database is empty)")
    
#     cursor.close()
#     connection.close()
    
#     print()
#     print("🎉 Database connection test PASSED!")
    
# except pymysql.err.OperationalError as e:
#     print(f"❌ Connection failed: {e}")
#     print()
#     print("Common fixes:")
#     print("1. Make sure MySQL is running")
#     print("2. Check password in this file (currently 'root')")
#     print("3. Make sure 'qrlms' database exists")
    
# except Exception as e:
#     print(f"❌ Error: {e}")


# from passlib.context import CryptContext

# print("Testing password hashing...")
# print()

# # Create password context
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Test password
# plain_password = "student123"
# print(f"Original password: {plain_password}")

# # Hash it
# hashed_password = pwd_context.hash(plain_password)
# print(f"Hashed password: {hashed_password}")
# print()

# # Verify correct password
# is_correct = pwd_context.verify("student123", hashed_password)
# print(f"Verify 'student123': {is_correct} ✅")

# # Verify wrong password
# is_wrong = pwd_context.verify("wrongpassword", hashed_password)
# print(f"Verify 'wrongpassword': {is_wrong} ✅")

# print()
# print("🎉 Password hashing test PASSED!")


# from jose import jwt
# from datetime import datetime, timedelta

# print("Testing JWT tokens...")
# print()

# SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
# ALGORITHM = "HS256"

# # Create token
# data = {"user_id": "1001", "role": "student"}
# expire = datetime.utcnow() + timedelta(minutes=30)
# data_with_expiry = {**data, "exp": expire}

# token = jwt.encode(data_with_expiry, SECRET_KEY, algorithm=ALGORITHM)

# print(f"Created token: {token[:50]}...")
# print()

# # Decode token
# decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# print(f"Decoded data: {decoded}")
# print()

# print("🎉 JWT token test PASSED!")


