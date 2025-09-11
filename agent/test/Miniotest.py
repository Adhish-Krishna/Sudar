from minio import Minio
from envconfig import MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME, MINIO_URL
from minio.commonconfig import Tags

print(MINIO_BUCKET_NAME)


minio_client = Minio(
    endpoint=MINIO_URL.replace("http://", "").replace("https://", ""),
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure = False
)

filepath = "C:\\Users\\strea\\Downloads\\23N206 Adhish Krishna S CN DNS using UDP.pdf"
object_name = "23N206 Adhish Krishna S CN DNS using UDP.pdf"
metadata = {
    "type":"fileupload" 
}

tags = Tags(for_object=True)
tags["user_id"] = "teacher001"
tags["chat_id"] = "1"
res = minio_client.fput_object(bucket_name=MINIO_BUCKET_NAME,file_path=filepath, object_name=object_name, metadata=metadata, tags=tags)

if res:
    print("object sucessfully uploaded")

