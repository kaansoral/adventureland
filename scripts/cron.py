import requests
import time
import traceback
from datetime import datetime
import os
urls_and_intervals = [
    ('http://127.0.0.1:8083/cr/all/character', 3600),  # 1 hour in seconds
    # ('http://127.0.0.1:8083/cr/all/mail', 120),  # 2 minute in seconds
    ('http://127.0.0.1:8083/cr/all/user', 3600),  # 1 hour in seconds
    ('http://127.0.0.1:8083/cr/unstuck', 300),  # 5 minutes in seconds
    ('http://127.0.0.1:8083/cr/hourly', 3600),  # 1 hour in seconds
    ('http://127.0.0.1:8083/cr/all/backups', 43200),  # 12 hours in seconds
]
last_execution_times = {url: 0 for url, _ in urls_and_intervals}
log_file_path = "cron-logs.txt"
if not os.path.exists(log_file_path):
    with open(log_file_path, "w"):
        pass
def run_cron_jobs():
    current_time = int(time.time())
    for url, interval in urls_and_intervals:
        last_execution_time = last_execution_times[url]       
        if current_time - last_execution_time >= interval:
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    success_message = "{} - Successfully ran cron job for URL: {}\n".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), url)
                    print(success_message)
                    with open(log_file_path, "a") as log_file:
                        log_file.write(success_message)
                else:
                    error_message = "{} - Failed to run cron job for URL: {}. Status code: {}\n".format(datetime.now(), url, response.status_code)
                    print(error_message)
                    with open(log_file_path, "a") as log_file:
                        log_file.write(error_message)
            except Exception as e:
                error_message = "{} - Error running cron job for URL: {}\n{}\n".format(datetime.now(), url, traceback.format_exc())
                print(error_message)
                with open(log_file_path, "a") as log_file:
                    log_file.write(error_message)
            
            last_execution_times[url] = current_time
if __name__ == '__main__':
    while True:
        run_cron_jobs()
        time.sleep(60)
