Automatically enters or leaved the Home Mode on the Synology Surveillance Station when a mobile phone gets on the WIFI.

This is for advanced users...

This node.js script checks the presence of a mobile phone on the network. If one of the mobile phones configured is on the network, it calls the Web Hook to _enter_ Home Mode. If none of the mobile phones configured is on the network, it calls the Web Hook to _leave_ Home Mode.

# Step 1: Web Hooks
Create two Web Hooks in your Synology Surveillance Station: one to Enter Home Mode, one to leave home mode. When creating these hooks, ensure you select the `GET` method. Take a note of the URLs of those two web hooks for the configuration file below.

# Step 2: Router DHCP
Log on to your router's admin page and find your mobile phones. Add all your mobile phones to the "DHCP Reservation" list. This will ensure that your mobile phones will not change IP addresss.

Write down the IP address and MAC address of all your mobile phones for the configuration file below.

Also write down the IP address of your Synology Disk Station if you don't already have it.

# Step 3: Router Network Isolation
Make sure that "Network Isolation" is disabled. Typically, most routers offer a primary network where "Network Isolation" is disabled, and a guest network where it is enabled. 

This script will run on your Synology Disk Station. For this to work, the Synology Disk Station needs to be on the same network as the mobile phones; and Network Isolation needs to be disabled so that the mobile phones can be discovered.

# Step 4: config.json
Create the following configuration file `config.json`.

    {
        "phones": [
            {
                "name": "john",
                "ip": "192.168.X.XXX",
                "mac": "xx:xx:xx:xx:xx:xx"
            },
            {
                "name": "simon",
                "ip": "192.168.Y.YYY",
                "mac": "yy:yy:yy:yy:yy:yy"
            }
        ],
        "homeModeWebHooks": {
            "enter": "...",
            "leave": "..."
        }
    }

# Step 5: Upload the code to the Disk Station
Make sure that the appliction Node.js is installed on your Synology Disk Station.

On your Synology Disk Station, create a user e.g. `api_user` which only has access to the Synology Surveillance Station application. In that user's home folder, create a new folder with the name e.g. `switch-home-mode` and upload the following files into it.

    ./switch-home-mode/config.json
    ./switch-home-mode/main.js
    ./switch-home-mode/package.json

On your Control Panel, temporarily enable SSH (under "Terminal & SNMP").
Then in a terminal you can type the following command `ssh admin@diskstation.local`.
 - In that command `diskstation.local` is obviously the IP address of your disk station.
 - And `admin` is the user name of an admin account on your disk station.

Then you need to cd in the `switch-home-mode` folder and type `npm install` to install the dependencies inside the `node_modules` folder.

    cd /var/services/homes/api_user/switch-home-mode
    npm install # Install dependencies in the node_modules folder
    node main.js # Test the application

> It may be possible to run the command `npm install` on your personal computer rather than using SSH, and upload the `node_modules` folder to the Disk Station. But the command `npm install` may install a slightly different set of dependencies depending on the operating system.

At this point, it is a good time to test your script using the command `node main.js`. Try to connect/disconnect your phone from the WIFI and verify that it enters or leave the home mode.

# Step 6: Scheduled Task

Finally on the Synology Disk Station's Control Panel, create a scheduled task to execute this script every 20 minutes.
 - Under _Gerneral_ make sure you select the user `api_user`.
 - Configure that scipt to run every 20 minutes.
 - The _User-defined script_ is:

    echo This is running from $PWD
    node ./switch-home-mode/main.js

Note that to see the output of the scheduled tasks, you need to go to the settings and configure a folder in which the scheduled tasks' outputs will be saved. Make sure that `api_user` has read/write rights to that folders.