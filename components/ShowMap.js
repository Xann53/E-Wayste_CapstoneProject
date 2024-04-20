import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import * as Location from 'expo-location';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../environments';
import MapViewDirections from 'react-native-maps-directions';

import LoadData from './LoadDataAuthMap';
import RepMarker from './ReportMarker';
import Reload from './ReloadMap';
import DisplayRepInfo from './DisplayRepPinInfo';
import ChangeStatus from './ChangeStatusMap';
import MTruckList from './MapTruckList';
import TaskPanel from './colTaskPanel';

export default function LoadMap({ mapRef, page }) {
    const userRef = firebase.firestore().collection("users");
    const scheduleRef = firebase.firestore().collection("schedule");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");
    const collectorLocRef = firebase.firestore().collection("collectorLocationTrack");
    const activeRef = firebase.firestore().collection("activeTask");
    const collectorLoc = collection(db, "collectorLocationTrack");
    const activeRouteRef = firebase.firestore().collection("routeForActiveCollection");

    let userMun;
    
    const [mapType, setMapType] = useState('uncollected');
    const [infoID, setInfoID] = useState();
    const [infoImage, setInfoImage] = useState();
    const [openTruckList, setOpenTruckList] = useState(false);
    const [openTaskList, setOpenTaskList] = useState(false);

    const [userID, setUserID] = useState('');
    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [state, setState] = useState({ coordinates: [] });
    const [collectorLocation, setCollectorLocation] = useState([]);
    const [allActiveTask, setAllActiveTask] = useState([]);
    const [allActiveRoute, setAllActiveRoute] = useState([]);
    const [allSched, setAllSched] = useState([]);
    
    const [track, setTrack] = useState({ coordinates: [] });

    const [currentLat, setCurrentLat] = useState(null);
    const [currentLon, setCurrentLon] = useState(null);
    const [origin, setOrigin] = useState({});
    const [destination, setDestination] = useState({});
    const [showColMarker, setShowColMarker] = useState(false);
    const [showDirection, setShowDirection] = useState(false);
    const [showFlag, setShowFlag] = useState(false);
    const [showRepPin, setShowRepPin] = useState(true);

    useEffect(() => {
        const getID = async() => {
            const temp = await AsyncStorage.getItem('userId');
            setUserID(temp);
        }
        getID();
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(newData);
        };
        const unsubscribe = userRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllSched(newData);
        };
        const unsubscribe = scheduleRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllActiveRoute(newData);
        };
        const unsubscribe = activeRouteRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const getMapData = async() => {
            userMun = await AsyncStorage.getItem('userMunicipality');
            LoadData(userMun, reportRef, imageColRef, collectorLocRef, activeRef, mapType, setInfoID, users, setUserUploads, imageCol, setImageCol, setState, setTrack, setAllActiveTask, setCollectorLocation);
        }
        getMapData();
    }, [])

    const changeMap = async() => {
        userMun = await AsyncStorage.getItem('userMunicipality');
        Reload(userMun, mapType, setInfoID, userUploads, imageCol, setState, 'Auto');
    }

    const reloadManual = async() => {
        userMun = await AsyncStorage.getItem('userMunicipality');
        Reload(userMun, mapType, setInfoID, userUploads, imageCol, setState, 'Manual');
    }

    const changeStatus = async(id, changeType) => {
        ChangeStatus(users, userUploads, id, changeType);
    }

    const trackRoute = async(tempId) => {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        try {
            await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 1,
            },(location) => {
                setCurrentLat(location.coords.latitude);
                setCurrentLon(location.coords.longitude);
                updateLocData(location.coords.latitude, location.coords.longitude, tempId);
            })
        } catch(e) {}
    }

    const updateLocData = async(latitude, longitude, tempId) => {
        try {
            const colDoc = doc(db, "collectorLocationTrack", tempId);
            const newFields = {
            latitude: latitude,
            longitude: longitude
        };
        await updateDoc(colDoc, newFields);
        } catch(e) {}
    }

    const quickRoute = async(desLatitude, desLongitude) => {
        (async() => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }
            let currentLocation = await Location.getCurrentPositionAsync({});

            setOrigin({latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude});
            setDestination({latitude: desLatitude, longitude: desLongitude});
        })();
    }

    return (
        <>
            <TouchableOpacity activeOpacity={0.5} onPress={() => { mapType === 'uncollected' ? setMapType('collected') : setMapType('uncollected'); changeMap()}} style={{position: 'absolute', top: '3%', zIndex: 50, justifyContent: 'center', alignItems: 'center',}}>
                {mapType === 'uncollected' ?
                    <Text style={{fontWeight: 800, color: '#F76811', fontSize: 18}}>UNCOLLECTED</Text>
                    :
                    <Text style={{fontWeight: 800, color: '#24E559', fontSize: 18}}>COLLECTED</Text>
                }
            </TouchableOpacity>

            <View style={{position: 'absolute', top: 20, right: 15, zIndex: 10, alignItems: 'center', gap: 5}}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {reloadManual()}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <Ionicons name='reload-circle' style={{ fontSize: 35, top: 0, left: 1, color: 'white' }} />
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.5} onPress={() => {showRepPin ? setShowRepPin(false) : setShowRepPin(true); setInfoID()}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='eye' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                    </View>
                </TouchableOpacity>

                {(page === 'Collector') &&
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenTruckList(true)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='bus' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                        </View>
                    </TouchableOpacity>
                }

                <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenTaskList(true)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='clipboard' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.5} onPress={() => {quickRoute(destination.latitude, destination.longitude)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='compass' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                    </View>
                </TouchableOpacity>

                {/* <TouchableOpacity activeOpacity={0.5} onPress={() => {}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='flag' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                    </View>
                </TouchableOpacity> */}
            </View>

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

                {showRepPin && <RepMarker mapType={mapType} state={state} setInfoID={setInfoID} setInfoImage={setInfoImage} />}

                {(showColMarker && (currentLat !== null && currentLon !== null)) &&
                    <Marker
                        key={"My Location"}
                        coordinate={{
                            latitude: parseFloat(currentLat),
                            longitude: parseFloat(currentLon)
                        }}
                    >
                        <Ionicons name='location' style={{fontSize: 35, color: '#D31111', zIndex: 99}} />
                        <Ionicons name='location' style={{fontSize: 40, color: '#FFFFFF', zIndex: -1, position: 'absolute', transform: [{translateX: -2.5}, {translateY: -2.5}]}} />
                    </Marker>
                }

                {(showDirection && (origin.latitude !== undefined && origin.longitude !== undefined) && (destination.latitude !== undefined && destination.longitude !== undefined)) &&
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_API_KEY }
                        strokeWidth={4}
                        strokeColor='#6644ff'
                    />
                }

                {(showFlag) &&
                    <>
                        {allActiveTask.map((task) => {
                            if(task.userId === userID) {
                                return(
                                    allActiveRoute.map((route) => {
                                        if(route.activeTaskId === task.id) {
                                            return(
                                                route.taskRoute.map((loc) => {
                                                    return(
                                                        <Marker
                                                            key={loc.name}
                                                            coordinate={{
                                                                latitude: parseFloat(loc.latitude),
                                                                longitude: parseFloat(loc.longitude)
                                                            }}
                                                        >
                                                            <Image style={{width: 45, height: 45, resizeMode: 'contain'}} source={require('../assets/collection-pin.png')} />
                                                        </Marker>
                                                    );
                                                })
                                            );
                                        }
                                    })
                                );
                            }
                        })}
                    </>
                }
                
            </MapView>

            <DisplayRepInfo infoID={infoID} setInfoID={setInfoID} infoImage={infoImage} mapType={mapType} users={users} userUploads={userUploads} changeStatus={changeStatus} page={page} />

            {openTruckList && <MTruckList open={setOpenTruckList} collectorLocation={collectorLocation} collectorLoc={collectorLoc} users={users} />}
        
            {openTaskList && <TaskPanel open={setOpenTaskList} trackRoute={trackRoute} setShowColMarker={setShowColMarker} quickRoute={quickRoute} setShowDirection={setShowDirection} setShowFlag={setShowFlag} />}
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