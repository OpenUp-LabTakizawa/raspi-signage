import { createFirebaseApp } from "../firebase/clientApp";
import { getDownloadURL, getStorage, listAll, ref } from "firebase/storage";
import { collection, getDocs, getFirestore } from "firebase/firestore";

export const downLoadURLList = async({areaId}) => {
    let urlList = [];

    const app = createFirebaseApp();
   
    const storage = getStorage(app);
    const storageRef = ref(storage, areaId);
    const refList = await (await listAll(storageRef)).items;
    for (let ref of refList) {
        await getDownloadURL(ref).then(url => {
            urlList.push(url);
        }).catch(err => alert(err));
    }
    return urlList;
}