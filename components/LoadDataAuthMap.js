import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export default function LoadData(userMun, reportRef, imageColRef, collectorLocRef, activeRef, mapType, setInfoID, users, setUserUploads, imageCol, setImageCol, setState, setTrack, setAllActiveTask, setCollectorLocation) {
    
    const loadPin = async() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUserUploads(newData);

            listAll(imageColRef).then((response) => {
                setImageCol([]);
                response.items.forEach((item) => {
                    getDownloadURL(item).then((url) => {
                        setImageCol((prev) => [...prev, url])
                    })
                })
            })

            setState({ coordinates: [] });
            newData.map((pin) => {
                if(pin.municipality === userMun) {
                    let imageURL;
                    imageCol.map((url) => {
                        if(url.includes(pin.associatedImage)) {
                            imageURL = url;
                        }
                    })
                    try {
                        if(mapType === 'uncollected' && pin.status === 'uncollected') {
                            const lat = parseFloat(pin.latitude);
                            const long = parseFloat(pin.longitude);
                            setState((prevState) => ({
                                ...prevState,
                                coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                            }));
                        } else if(mapType === 'collected' && pin.status === 'collected') {
                            const lat = parseFloat(pin.latitude);
                            const long = parseFloat(pin.longitude);
                            setState((prevState) => ({
                                ...prevState,
                                coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                            }));
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            })
            setInfoID();

        };

        const unsubscribe = reportRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }

// ========================================================================================================================================================================================================================================

    const loadColLocation = async() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setTrack({ coordinates: [] });
            newData.map((pin) => {
                let collector;
                users.map((user) => {
                    if(user.id.includes(pin.userId)) {
                        collector = user.firstName + ' ' + user.lastName;
                    }
                })
                
                if(pin.latitude !== '' && pin.longitude !== '') {
                    try {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setTrack((prev) => ({
                            ...prev,
                            coordinates: [...prev.coordinates, { name: pin.id, user: pin.userId, collectorName: collector, latitude: lat, longitude: long }],
                        }));
                    } catch (e) {
                        console.log(e);
                    }
                }
            })

        };

        const unsubscribe = collectorLocRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }

// ========================================================================================================================================================================================================================================

    const loadColInProgress = async() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setAllActiveTask(newData);

        };

        const unsubscribe = activeRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }

// ========================================================================================================================================================================================================================================
    
    const loadColLocation2 = async() => {
        collectorLocRef.onSnapshot(
            querySnapshot => {
                const uploads = []
                querySnapshot.forEach((doc) => {
                    const {truckId, latitude, longitude} = doc.data();
                    uploads.push({
                        id: doc.id,
                        truckId,
                        latitude,
                        longitude
                    })
                })
                setCollectorLocation(uploads)
            }
        )
    }

    return(loadPin(), loadColLocation(), loadColInProgress(), loadColLocation2());
}