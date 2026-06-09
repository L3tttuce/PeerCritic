from model.Writer import Writer, WriterCardPublic
from router._list import build_list_router

router = build_list_router(Writer, WriterCardPublic, "/writers", lambda: Writer.writer_id)
