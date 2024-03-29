import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../environments';
import SideBar from '../../components/SideNav';
import PushNotif from '../../components/PushNotification';

export default function MapCol({ navigation }) {
    const isFocused = useIsFocused();
    const [openSideBar, setOpenSideBar] = useState();
    const mapRef = useRef(null);
    let searchLongitude, searchLatitude;
    const [mapType, setMapType] = useState('uncollected');

    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [collectorLocation, setCollectorLocation] = useState([]);
    const [schedRoute, setSchedRoute] = useState([]);
    const [state, setState] = useState({ coordinates: [] });
    const [routeFlag, setRouteFlag] = useState([]);
    const [displayFlag, setDisplayFlag] = useState(false);

    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const collectorLocRef = firebase.firestore().collection("collectorLocationTrack");
    const scheduleRef = firebase.firestore().collection("schedule");
    const collectorLoc = collection(db, "collectorLocationTrack");
    const imageColRef = ref(storage, "postImages/");

    const [currentLat, setCurrentLat] = useState(null);
    const [currentLon, setCurrentLon] = useState(null);
    const [origin, setOrigin] = useState({});
    const [destination, setDestination] = useState({});

    const [infoID, setInfoID] = useState();
    const [infoImage, setInfoImage] = useState();
    let colStatus;

    let userId
    let description
    let location
    let dateTime

    const [colMenu, setColMenu] = useState(false);
    const colInProgressRef = firebase.firestore().collection("collectionInProgress");
    const colInProgressRef2 = collection(db, "collectionInProgress");
    const [colID, setColID] = useState();
    const [colInProgress, setColInProgress] = useState();
    let collectionIDTemp
    // =============================================================================================================================================================================================
    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });

    function SideNavigation(navigation) {
        return (
            <>
                <View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99}}>
                    <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => {setOpenSideBar()}}>
                        <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
                    </TouchableOpacity>
                    {SideBar(navigation)}
                    <TouchableOpacity style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1}} onPress={() => {setOpenSideBar()}} />
                </View>
            </>
        );
    }

    const moveCameraTo = (latitude, longitude) => {
        const region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.02,
        };
      
        mapRef.current.animateToRegion(region, 1000);
    }
    // =============================================================================================================================================================================================

    useEffect(() => {
        const getUsers = async () => {
            const data = await getDocs(usersCollection);
            setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        };
        getUsers();

        reportRef.onSnapshot(
            querySnapshot => {
                const uploads = []
                querySnapshot.forEach((doc) => {
                    const {associatedImage, dateTime, description, location, status, userId, longitude, latitude} = doc.data();
                    uploads.push({
                        id: doc.id,
                        associatedImage,
                        dateTime,
                        description,
                        location,
                        status,
                        userId,
                        longitude,
                        latitude
                    })
                })
                setUserUploads(uploads)

                listAll(imageColRef).then((response) => {
                    setImageCol([]);
                    response.items.forEach((item) => {
                        getDownloadURL(item).then((url) => {
                            setImageCol((prev) => [...prev, url])
                        })
                    })
                })
            }
        )

        collectorLocRef.onSnapshot(
            querySnapshot => {
                const uploads = []
                querySnapshot.forEach((doc) => {
                    const {userId, latitude, longitude} = doc.data();
                    uploads.push({
                        id: doc.id,
                        userId,
                        latitude,
                        longitude
                    })
                })
                setCollectorLocation(uploads)
            }
        )
    }, []);

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setColInProgress(newData);

        };

        const unsubscribe = colInProgressRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setSchedRoute(newData);

        };

        const unsubscribe = scheduleRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    function loadMap() {
        const changeMap = async() => {
            if(mapType === 'uncollected') {
                setMapType('collected');
            } else if(mapType === 'collected') {
                setMapType('uncollected');
            }
            reload2();
        }

        const reload = async() => {
            setState({ coordinates: [] });
            userUploads.map((pin) => {
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
            })
            setInfoID();
            createLocData();
        }

        const reload2 = async() => {
            let temp;
            if(mapType === 'collected')
                temp = 'uncollected';
            else if(mapType === 'uncollected')
                temp = 'collected';

            setState({ coordinates: [] });
            userUploads.map((pin) => {
                let imageURL;
                imageCol.map((url) => {
                    if(url.includes(pin.associatedImage)) {
                        imageURL = url;
                    }
                })
                try {
                    if(temp === 'uncollected' && pin.status === 'uncollected') {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setState((prevState) => ({
                            ...prevState,
                            coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                        }));
                    } else if(temp === 'collected' && pin.status === 'collected') {
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
            })
            setInfoID();
            createLocData();
        }

        const createLocData = async() => {
            try {
                const userID = await AsyncStorage.getItem('userId');
                const temp = collectorLocation.map((colLocation) => {
                    if(colLocation.userId === userID) {
                        return true;
                    }
                })
                const targetVal = true;
                const temp2 = temp.includes(targetVal);
                console.log(temp2);

                if(!temp2) {
                    await addDoc(collectorLoc, {
                        userId: userID,
                        latitude: '',
                        longitude: '',
                    });
                }
            } catch(e) {
                console.log(e);
            }
        }

        const updateLocData = async(latitude, longitude, tempId) => {
            const colDoc = doc(db, "collectorLocationTrack", tempId);
            const newFields = {
                latitude: latitude,
                longitude: longitude
            };
            await updateDoc(colDoc, newFields);
        }

        const trackRoute = async() => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const userID = await AsyncStorage.getItem('userId');
            let tempId;
            collectorLocation.map((colLocation) => {
                if(colLocation.userId === userID) {
                    tempId = colLocation.id;
                }
            })

            await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 1,
            },(location) => {
                setCurrentLat(location.coords.latitude);
                setCurrentLon(location.coords.longitude);
                updateLocData(location.coords.latitude, location.coords.longitude, tempId);
            })

            console.log('is Tracking');
        }

        const quickRoute = async(desLatitude, desLongitude) => {
            (async() => {
                let {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }
                let currentLocation = await Location.getCurrentPositionAsync({});

                trackRoute();

                setOrigin({latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude});
                setDestination({latitude: desLatitude, longitude: desLongitude});
            })();
        }

        const showRoute = async() => {
            setRouteFlag([]);
            schedRoute.map((temp) => {
                if(temp.collectionRoute.coordinates.length > 0) {
                    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    const color = '#' + randomColor;
                    setRouteFlag((prev) => [
                        ...prev,
                        {
                            id: temp.id,
                            coordinates: temp.collectionRoute.coordinates,
                            color: color
                        }
                    ]);
                }
            })
        }

        function ShowFlag() {
            let temp = [];
            routeFlag.map((marker) => {
                for (let i = 0; i < marker.coordinates.length; i++) {
                    const randomName = (Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')) + '';
                    temp.push(
                        <Marker
                            key={randomName}
                            coordinate={{
                                latitude: parseFloat(marker.coordinates[i].latitude),
                                longitude: parseFloat(marker.coordinates[i].longitude)
                            }}
                            style={{zIndex: 95}}
                            onPress={() => {setColMenu(true); setColID(marker.id); setInfoID()}} // ==================================================== Come Back Here
                        >
                            <Ionicons name='flag' style={{fontSize: 25, color: marker.color}} />    
                        </Marker>
                    );
                } 
            });

            <ul>
                {temp.map(item =>
                    <li key="{item}">{item}</li>
                )}
            </ul>

            return(
                <>
                    {temp}
                </>
            );
        }

        const statusChange = async(id) => {
            setInfoID();
            try {
                const docRef = firebase.firestore().collection("generalUsersReports").doc(id);
                await docRef.update({
                    status: 'collected',
                });

                let userFullName, location;
                userUploads.map((temp) => {
                    if(temp.id.includes(id)) {
                        users.map((user) => {
                            if(user.id.includes(temp.userId)) {
                                userFullName = user.firstName + ' ' + user.lastName;
                            }
                        });
                        location = temp.location;
                    }
                })

                const title = 'REPORTED GARBAGE COLLECTED';
                const body = 'Garbage reported by ' + userFullName + ' at location (' + location + ') has been collected';
                const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
                PushNotif(title, body, fullDateTime);
            } catch(e) {
                console.error(e);
            }
        }

        const startACol = async() => {
            const id = await AsyncStorage.getItem('userId');
            const collectorID = id + '';
            const collectionID = colID + '';
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');

            if(collectorID !== null && collectionID !== null) {
                await addDoc(colInProgressRef2, {
                    collectionID: collectionID,
                    collectorID: collectorID,
                    fullDateTime: fullDateTime,
                });
            }
            
            const title = 'GARBAGE COLLECTION DAY!';
            const body = 'Scheduled Collection has started';
            PushNotif(title, body, fullDateTime);
        }

        const stopACol = async() => {
            let id
            colInProgress.map((temp) => {
                if(temp.collectionID.includes(colID)) {
                    id = temp.id;
                }
            })

            try {
                const docRef = firebase.firestore().collection('collectionInProgress').doc(id);
                await docRef.delete();
            } catch(e) {
                console.log(e);
            }

            const title = 'COLLECTION HAS ENDED';
            const body = 'Scheduled Collection has Ended';
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
            PushNotif(title, body, fullDateTime);
        }

        function menuDisplayRoute() {
            let temp = [];
            schedRoute.map((pin) => {
                if(pin.id.includes(colID)) {
                    pin.collectionRoute.coordinates.map((coord) => {
                        temp.push(
                            <Text style={{fontSize: 12}}><Ionicons name='location' />{coord.locationName}</Text>
                        )
                    })
                }
            });

            <ul>
                {temp.map(item =>
                    <li key="{item}">{item}</li>
                )}
            </ul>

            return(
                <>
                    {temp}
                </>
            );
        }

        return (
            <>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {reload()}} style={{position: 'absolute', height: 40, width: 40, backgroundColor: 'orange', top: 20, right: 15, zIndex: 99, justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <Ionicons name='refresh-circle' style={{ fontSize: 30, top: 0, left: 1, color: 'white' }} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {setDisplayFlag(!displayFlag ? true : false); showRoute();}} style={{position: 'absolute', height: 40, width: 40, backgroundColor: 'orange', top: 65, right: 15, zIndex: 99, justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <Ionicons name='flag' style={{ fontSize: 25, top: 0, left: 1, color: 'white' }} />
                </TouchableOpacity>
                {mapType === 'uncollected' ?
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {changeMap()}} style={{position: 'absolute', top: '3%', zIndex: 50, justifyContent: 'center', alignItems: 'center',}}>
                        <Text style={{fontWeight: 800, color: '#F76811', fontSize: 18}}>UNCOLLECTED</Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {changeMap()}} style={{position: 'absolute', top: '3%', zIndex: 50, justifyContent: 'center', alignItems: 'center',}}>
                        <Text style={{fontWeight: 800, color: '#24E559', fontSize: 18}}>COLLECTED</Text>
                    </TouchableOpacity>
                }
                <MapView
                    ref={mapRef}
                    style={{width: '100%', height: '100%'}}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: 10.3156992,
                        longitude: 123.88543660000005,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    customMapStyle={mapType === 'uncollected' ? mapStyle : mapStyle2}
                >
                    {mapType === 'uncollected' ?
                        <>
                            {state.coordinates.map(marker => (
                                <Marker
                                    key={marker.name}
                                    coordinate={{
                                        latitude: parseFloat(marker.latitude),
                                        longitude: parseFloat(marker.longitude)
                                    }}
                                    onPress={() => {setInfoID(marker.name); setInfoImage(marker.image); setColMenu(false)}}
                                    onCalloutPress={() => {quickRoute(marker.latitude, marker.longitude)}}
                                    style={{zIndex: 100}}
                                >
                                    <Ionicons name='location' style={{fontSize: 30, color: '#F76811'}} />
                                    <Callout>
                                        <View style={{width: 80, height: 80}}>
                                            <Text style={{position: 'absolute', top: -35, paddingBottom: 40}}>
                                                <Image style={{width: 80, height: 80}} source={{uri: marker.image}} />
                                            </Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            ))}
                        </>
                        :
                        <>
                            {state.coordinates.map(marker => (
                                <Marker
                                    key={marker.name}
                                    coordinate={{
                                        latitude: parseFloat(marker.latitude),
                                        longitude: parseFloat(marker.longitude)
                                    }}
                                    onPress={() => {setInfoID(marker.name); setInfoImage(marker.image)}}
                                    style={{zIndex: 100}}
                                >
                                    <Ionicons name='location' style={{fontSize: 30, color: '#24E559'}} />
                                    <Callout>
                                        <View style={{width: 80, height: 80}}>
                                            <Text style={{position: 'absolute', top: -35, paddingBottom: 40}}>
                                                <Image style={{width: 80, height: 80}} source={{uri: marker.image}} />
                                            </Text>
                                        </View>
                                    </Callout>
                                </Marker>
                            ))}
                        </>
                    }

                    {currentLat !== null && currentLon !== null ? 
                        <Marker
                            key={"My Location"}
                            coordinate={{
                                latitude: parseFloat(currentLat),
                                longitude: parseFloat(currentLon)
                            }}
                        >
                            <Ionicons name='location' style={{fontSize: 35, color: '#D31111'}} />
                            <Ionicons name='location' style={{fontSize: 40, color: '#FFFFFF', zIndex: -1, position: 'absolute', transform: [{translateX: -2.5}, {translateY: -2.5}]}} />
                        </Marker>
                        :
                        <></>
                    }
                    {(origin.latitude !== undefined && origin.longitude !== undefined) && (destination.latitude !== undefined && destination.longitude !== undefined) ?
                        <MapViewDirections
                            origin={origin}
                            destination={destination}
                            apikey={GOOGLE_API_KEY }
                            strokeWidth={4}
                            strokeColor='#6644ff'
                        />
                        :
                        <></>
                    }

                    {displayFlag ?
                        <>
                            {ShowFlag()}
                        </>
                        :
                        <></>
                    }
                </MapView>
                {infoID ?
                    <View style={{position: 'absolute', backgroundColor: 'white', zIndex: 99, height: 140, width: '90%', margin:20,
                     padding: 5, bottom: '10.5%', shadowColor: 'black', borderRadius: 15, shadowOffset:{width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 4, elevation: 5}}>
                        <View style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'row'}}>
                            <View style={{flex: 1, backgroundColor: '#E4EEEA', padding: 5, borderRadius: 10}}>
                                <Image style={{width: '100%', height: '100%',  flex: 1, resizeMode: 'cover', borderRadius: 5}} source={{uri: infoImage}} />
                            </View>
                            <View style={{flex: 2}}>
                                <View style={{flex: 1, padding: 5, overflow: 'hidden'}}>
                                    {userUploads.map((upload) => {
                                        if(upload.id.includes(infoID)) {
                                            userId=upload.userId;
                                            description=upload.description;
                                            location=upload.location;
                                            dateTime=upload.dateTime;

                                            if(upload.status === 'uncollected')
                                                colStatus = 'uncollected';
                                            else if(upload.status === 'collected')
                                                colStatus = 'collected';
                                        }
                                    })}
                                    <View style={{flex: 4}}>
                                        <Text style={{fontSize: 18, fontWeight: 700, color: 'green'}}>{users.map((user) => {if(user.id.includes(userId))return user.username})}</Text>
                                        <Text style={{fontSize: 10}}>{dateTime}</Text>
                                        <Text style={{fontSize: 12, marginTop: 10}}><Ionicons name='location' /> {location}</Text>
                                    </View>
                                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                        {mapType === 'uncollected' ?
                                            <>
                                                {colStatus === 'uncollected' ?
                                                    <TouchableOpacity style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden'}} activeOpacity={0.5} onPress={() => {statusChange(infoID)}}>
                                                        <View style={{flex: 1, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center'}}>
                                                            <Text style={{fontWeight: 700, color: 'white'}}>COLLECT</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    :
                                                    <View style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center'}}>
                                                        <Text style={{fontWeight: 700, color: 'grey'}}>COLLECTED</Text>
                                                    </View>
                                                }
                                            </>
                                            :
                                            <>
                                                <View style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'grey'}}>COLLECTED</Text>
                                                </View>
                                            </>
                                        }
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {setInfoID()}}>
                                <View style={{position: 'absolute', height: 20, width: 20, backgroundColor: '#E5E5E5', right: 5, top: 5, borderRadius: 100}}>
                                    <Ionicons name='close' style={{fontSize: 20, color: 'grey'}} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    :
                    <></>
                }
                {colMenu ?
                    <View style={{position: 'absolute', backgroundColor: 'white', zIndex: 99, margin: 20, height: 150, width: '90%', padding: 5, bottom: '10.5%', shadowColor: 'black', borderRadius: 15, shadowOffset:{width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 4, elevation: 4}}>
                        <View style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'row'}}>
                            <View style={{flex: 1, backgroundColor: '#E4EEEA', padding: 5, borderRadius: 10, justifyContent: 'center', alignItems: 'center'}}>
                                <Ionicons name='trash' style={{fontSize: 90, color: 'green'}} />
                            </View>
                            <View style={{flex: 2}}>
                                <View style={{flex: 1, padding: 5, overflow: 'hidden'}}>
                                    <View style={{flex: 4}}>
                                        <Text style={{fontSize: 18, fontWeight: 700, color: 'green'}}>COLLECTION</Text>
                                        <Text style={{fontSize: 10}}>{moment().utcOffset('+08:00').format('YYYY/MM/DD')}</Text>
                                        <ScrollView style={{marginTop: 5, display: 'flex', flex: 1, marginBottom: 2}}>
                                            {menuDisplayRoute()}
                                        </ScrollView>
                                    </View>
                                    {colInProgress.map((pin) => {
                                        if(pin.collectionID.includes(colID)) {
                                            collectionIDTemp = true;
                                        }
                                    })}
                                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                        {collectionIDTemp === true ?
                                            <TouchableOpacity style={{flex: 1, width: '75%', borderRadius: 10, overflow: 'hidden'}} activeOpacity={0.5} onPress={() => {stopACol()}}>
                                                <View style={{flex: 1, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'white'}}>STOP COLLECTION</Text>
                                                </View>
                                            </TouchableOpacity>
                                            :
                                            <TouchableOpacity style={{flex: 1, width: '75%', borderRadius: 10, overflow: 'hidden'}} activeOpacity={0.5} onPress={() => {startACol()}}>
                                                <View style={{flex: 1, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'white'}}>START COLLECTION</Text>
                                                </View>
                                            </TouchableOpacity>
                                        }
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {setColMenu(false)}}>
                                <View style={{position: 'absolute', height: 20, width: 20, backgroundColor: '#E5E5E5', right: 5, top: 5, borderRadius: 100}}>
                                    <Ionicons name='close' style={{fontSize: 20, color: 'grey'}} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    :
                    <></>
                }
            </>
        );
    }

    return (
        <>
            <View style={{position: 'absolute', zIndex: 99, width: '100%', paddingTop: 30, flexDirection: 'row', paddingHorizontal: 20}}>
                <TouchableOpacity style={{ zIndex: 99, marginRight: '2%', height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 100 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                    <Ionicons name='menu' style={{ fontSize: 40, color: 'rgb(70,149,78)' }} />
                </TouchableOpacity>
                <View style={{ flex: 2, zIndex: 99 }}>
                    <GooglePlacesAutocomplete
                        placeholder='Search'
                        fetchDetails
                        enablePoweredByContainer={false}
                        onPress={(data, details = null) => {
                            searchLatitude = details.geometry.location.lat;
                            searchLongitude = details.geometry.location.lng;
                            moveCameraTo(searchLatitude, searchLongitude);
                        }}
                        query={{
                            key: GOOGLE_API_KEY,
                            language: 'en',
                        }}
                        styles={{
                            textInput: {
                                height: 38,
                                fontSize: 14,
                                marginTop: 3,
                                shadowColor: 'black',
                                shadowOffset:{width: 2, height: 2},
                                shadowOpacity: 0.4,
                                shadowRadius: 4,
                                elevation: 4,
                            },
                            listView: {
                                backgroundColor:'#c8c7cc',
                            },
                            row: {
                                backgroundColor: '#FFFFFF',
                                padding: 9,
                                height: 38,
                                marginVertical: 0.01,
                            },
                            description: {
                                fontSize: 12
                            },
                        }}
                    />
                </View>
            </View>
            {openSideBar}
            <View>
                <View 
                    style={{
                        height: 80,
                        backgroundColor: 'rgba(126, 185, 73, 1)',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        zIndex: 90,
                        shadowColor: 'black',
                        shadowOffset:{width: 3, height: 3},
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                />
                <View style={{display: 'flex', height: '91%', justifyContent: 'center', alignItems: 'center', top: -10}}>
                    {loadMap()}
                </View>
            </View>
        </>
    );
}

const mapStyle = [
    {
        elementType: 'labels.icon',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
    {
        featureType: 'poi.business',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
];

const mapStyle2 = [
    {
        elementType: 'labels.icon',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
    {
        featureType: 'poi.business',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
    {
        elementType: "geometry",
        stylers: [
            {
                color: "#242f3e"
            },
        ],
    },
    {
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#746855"
            },
        ],
    },
    {
        elementType: "labels.text.stroke",
        stylers: [
            { 
                color: "#242f3e"
            },
        ],
    },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            },
        ],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            },
        ],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [
            {
                color: "#263c3f" 
            },
        ],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#6b9a76"
            },
        ],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [
            {
                color: "#38414e"
            },
        ],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#212a37"
            },
        ],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#9ca5b3"
            },
        ],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [
            {
                color: "#746855"
            },
        ],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#1f2835"
            },
        ],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#f3d19c"
            },
        ],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [
            {
                color: "#2f3948"
            },
        ],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#d59563"
            },
        ],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [
            {
                color: "#17263c"
            },
        ],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#515c6d"
            },
        ],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [
            {
                color: "#17263c"
            },
        ],
    },
]