from config import *
from functions import *

# for Python2 [27/01/24]

class PhotoUpload(blobstore_handlers.BlobstoreUploadHandler):
    @ndb.toplevel
    def post(self):
        domain=get(request); user=get_user(self,domain)
        if security_threat(self,domain): return
        if not getattr(user,"admin",False): return
        upload_files = self.get_file_infos('image'); file_info = upload_files[0]; blob_key=blobstore.create_gs_key_async(file_info.gs_object_name)
        key=gdmul(request,"key");
        logging.info("Image Upload %s"%(key))
        upload=get_by_iid("upload|%s"%key); blob_key=blob_key.get_result()
        if not upload: upload=Upload(key=ndb.Key(Upload,key),info=GG())


        if file_info.content_type in ["image/jpg","image/jpeg","image/jpe","image/png","image/gif"]:
            if gf(upload,"blob_key"):
                try:
                    blobstore.delete(blob_keys=upload.info.blob_key)
                    logging.info("Old image deleted")
                except: log_trace()

            url=get_serving_url(blob_key,size=images.IMG_SERVING_SIZES_LIMIT)
            size=get_image_size(blob_key,encoding=filetype_to_image_encoding(file_info.content_type))
            
            upload.info.blob_key=blob_key
            upload.info.content_type=file_info.content_type
            upload.info.gs_object_name=file_info.gs_object_name
            upload.info.url=url
            upload.info.width=size.width
            upload.info.height=size.height

            self.response.out.write("{<br/>&nbsp;'%s':{'url':'%s','width':%s,'height':%s},<br />}"%(key,url,size.width,size.height))
            upload.put()
        else:
            blobstore.delete(blob_keys=blob_key)
            self.response.out.write("Not an image")
    def get(self): self.post()

class PhotoUploader(webapp.RequestHandler):
    @ndb.toplevel
    def get(self):
        domain=get(request); user=get_user(self,domain)
        if security_threat(self,domain): return
        upload_url=blobstore.create_upload_url('/admin/upload/handler',gs_bucket_name=domain.gcs_bucket+"/files")
        whtml(request,"utility/htmls/uploader.html",domain=domain,upload_url=upload_url)

class TileUpload(blobstore_handlers.BlobstoreUploadHandler):
    @ndb.toplevel
    def post(request):
        domain=gdi(request); user=get_user(request,domain)
        if security_threat(request,domain): return
        upload_files = request.get_file_infos('image'); file_info = upload_files[0]; blob_key=blobstore.create_gs_key_async(file_info.gs_object_name)
        key,name=gdmul(request,"key","iname")
        if name not in ["map","map_a"] or not user or not key.startswith(""+user.k()):
            if 0: return jhtmle(request,"Permission issue")
            else: return request.response.set_data("Permission issue")
        logging.info("Image Upload %s %s"%(key,name))
        map=get_by_iid("map|%s"%key); blob_key=blob_key.get_result()
        if not map: map=Map(key=ndb.Key(Map,key),info=GG())

        if file_info.content_type in ["image/jpg","image/jpeg","image/jpe","image/png","image/gif"]:
            if gf(map,"image_%s"%name):
                try: blobstore.delete(blob_keys=gf(map,"image_%s"%name).blob_key)
                except: log_trace()
            setattr(map.info,"image_%s"%name,cGG(blob_key=blob_key,
                content_type=file_info.content_type,gs_object_name=file_info.gs_object_name))
            if 0: jhtml(request,[{"type":"success","message":"Image uploaded"}])
            else: request.redirect("/map/"+key)
            map.put()
        else:
            blobstore.delete(blob_keys=blob_key)
            if 0: jhtmle(request,"Not an image")
            else: request.response.set_data("Not an image")
    def get(): request.post()

class GCSServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(resource):
        #resource = str(urllib.unquote(resource))
        #blob_key=blobstore.create_gs_key(resource)
        #request.send_blob(blob_key)
        logging.info("here")
        resource = str(urllib.unquote(resource))
        request.send_blob(resource)

application = webapp.WSGIApplication([
    ('/admin/upload', PhotoUploader),
    ('/admin/upload/handler', PhotoUpload),
    ('/upload/tileset.*',TileUpload),
    ('/tileset/(.*)\.png',GCSServeHandler),
    ],debug=is_sdk)