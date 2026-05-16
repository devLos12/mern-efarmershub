import { useEffect } from "react";

const Download_Rider_App = () => {

    const APK_LINK = "https://github.com/devLos12/mern-efarmerShub/releases/download/v1.2.0/application-cf64accb-28bb-4ec2-8eb4-0fc8a8a22550.apk";

    useEffect(() => {
        const a = document.createElement("a");
        a.href = APK_LINK;
        a.download = "EFarmersHub-Rider.apk";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // balik sa email after trigger ng download
        setTimeout(() => {
            window.history.back();
        }, 2000);
    }, []);

    return null

}

export default Download_Rider_App;