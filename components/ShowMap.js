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
import TaskPanel from './TaskPanelCol';
import TaskView from './TaskPanelView';
import PushNotif from './PushNotification';

export default function LoadMap({ mapRef, page }) {
    const userRef = firebase.firestore().collection("users");
    const scheduleRef = firebase.firestore().collection("schedule");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");
    const collectorLocRef = firebase.firestore().collection("collectorLocationTrack");
    const activeRef = firebase.firestore().collection("activeTask");
    const collectorLoc = collection(db, "collectorLocationTrack");
    const activeRouteRef = firebase.firestore().collection("routeForActiveCollection");
    const sihftRef = firebase.firestore().collection("collectorShift");
    const colLocationRef = firebase.firestore().collection("collectorLocationTrack");

    let userMun;
    
    const [mapType, setMapType] = useState('uncollected');
    const [infoID, setInfoID] = useState();
    const [infoImage, setInfoImage] = useState();
    const [openTruckList, setOpenTruckList] = useState(false);
    const [openTaskList, setOpenTaskList] = useState(false);
    const [openTaskListView, setOpenTaskListView] = useState(false);

    const [userID, setUserID] = useState('');
    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [state, setState] = useState({ coordinates: [] });
    const [collectorLocation, setCollectorLocation] = useState([]);
    const [allActiveTask, setAllActiveTask] = useState([]);
    const [allActiveRoute, setAllActiveRoute] = useState([]);
    const [allSched, setAllSched] = useState([]);
    const [allShift, setAllShift] = useState([]);
    const [allColLocation, setAllColLocation] = useState([]);
    
    const [track, setTrack] = useState({ coordinates: [] });

    const [currentLat, setCurrentLat] = useState(null);
    const [currentLon, setCurrentLon] = useState(null);
    const [origin, setOrigin] = useState({});
    const [destination, setDestination] = useState({});
    const [showColMarker, setShowColMarker] = useState(false);
    const [showDirection, setShowDirection] = useState(false);
    const [showFlag, setShowFlag] = useState(false);
    const [showRepPin, setShowRepPin] = useState(true);
    const [showAssignPin, setShowAssignPin] = useState(false);
    const [assignPinLoc, setAssignPinLoc] = useState({});

    const [viewTrack, setViewTrack] = useState(false);
    const [taskToTrack, setTaskToTrack] = useState({});

    let tempDistance = [];
    const [viewDistance, setViewDistance] = useState();
    const [doneNotif, setDoneNotif] = useState([]);

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
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllShift(newData);
        };
        const unsubscribe = sihftRef.onSnapshot(onSnapshot);
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
            setAllColLocation(newData);
        };
        const unsubscribe = colLocationRef.onSnapshot(onSnapshot);
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

    const endAssignment = async(taskId) => {
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:MM:SS');
        const assignDoc = doc(db, 'schedule', taskId);
        await updateDoc(assignDoc, {
            collectionRecord: {
                status: 'collected',
                dateTimeCollected: fullDateTime
            }
        });

        let id;
        allActiveTask.map((task) => {
            if(task.taskId === taskId) {
                id = task.id;
            }
        })
        try {
            const docRef = firebase.firestore().collection('activeTask').doc(id);
            await docRef.delete();
            setShowColMarker(false);
            setShowDirection(false);
            setShowAssignPin(false);
        } catch(e) {}
    }

    const calculateDistanceColSide = (colLat, colLon) => {
        {allActiveTask.map((task) => {
            if(task.userId === userID) {
                allActiveRoute.map((route) => {
                    if(route.activeTaskId === task.id) {
                        route.taskRoute.map((loc) => {
                            const lat1 = colLat, lon1 = colLon, lat2 = loc.latitude, lon2 = loc.longitude, id = loc.name;
                            const toRadian = angle => (Math.PI / 180) * angle;
                            const R = 6371.01; // Earth's radius in kilometers
                            const dLat = toRadian(lat2 - lat1);
                            const dLon = toRadian(lon2 - lon1);
                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                      Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
                                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            const d = R * c;

                            tempDistance.push({
                                id: id,
                                distance: d.toFixed(2)
                            });

                            let tempDone = false;
                            const tempCompare = d.toFixed(2);
                            doneNotif.map((temp) => {
                                if(temp === id) {
                                    tempDone = true
                                }
                            })
                            if(tempCompare <= 0.50 && !tempDone) {
                                const title = 'HEADS UP!';
                                const body = 'Truck is near ' + loc.locationName;
                                const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
                                PushNotif(title, body, fullDateTime);
                                setDoneNotif([...doneNotif, id]);
                            }
                        })
                    }
                })
            }
        })}
    };

    const calculateDistance = (colLat, colLon) => {
        {allActiveTask.map((task) => {
            if(task.taskId === taskToTrack.taskId) {
                allActiveRoute.map((route) => {
                    if(route.activeTaskId === task.id) {
                        route.taskRoute.map((loc) => {
                            const lat1 = colLat, lon1 = colLon, lat2 = loc.latitude, lon2 = loc.longitude, id = loc.name;
                            const toRadian = angle => (Math.PI / 180) * angle;
                            const R = 6371.01; // Earth's radius in kilometers
                            const dLat = toRadian(lat2 - lat1);
                            const dLon = toRadian(lon2 - lon1);
                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                      Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
                                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            const d = R * c;

                            tempDistance.push({
                                id: id,
                                distance: d.toFixed(2)
                            });
                        })
                    }
                })
            }
        })}
    };

    return (
        allShift.map((shift) => {
            if(shift.driverId === userID) {
                collectorLocation.map((track) => {
                    if(track.id === shift.trackId) {
                        calculateDistanceColSide(track.latitude, track.longitude);
                    }
                })
            }
        }),
        allShift.map((shift) => {
            if(shift.id === taskToTrack.shiftId) {
                collectorLocation.map((track) => {
                    if(track.id === shift.trackId) {
                        calculateDistance(track.latitude, track.longitude);
                    }
                })
            }
        }),
    (
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

                {(page === 'Collector') &&
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenTaskList(true)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='clipboard' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                        </View>
                    </TouchableOpacity>
                }

                {(page !== 'Collector') &&
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenTaskListView(true)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='clipboard' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                        </View>
                    </TouchableOpacity>
                }

                {(page === 'Collector') &&
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {quickRoute(destination.latitude, destination.longitude)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='compass' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                        </View>
                    </TouchableOpacity>
                }

                {(page !== 'Collector' && viewTrack) && 
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setViewTrack(false); setTaskToTrack({})}} style={{height: 40, width: 40, backgroundColor: '#DE462A', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='eye-off' style={{ fontSize: 18, top: 0, left: 1, color: '#DE462A' }} />
                        </View>
                    </TouchableOpacity>
                }
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
                // showsUserLocation
            >
{/* ========================================================================================================================================================================================================================================================================================================================================================================================================================================== */}
                {showRepPin && <RepMarker mapType={mapType} state={state} setInfoID={setInfoID} setInfoImage={setInfoImage} viewTrack={viewTrack} taskToTrack={taskToTrack} />}

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

                {(showAssignPin) &&
                    <>
                        <Marker
                            key={'Assignment Pin'}
                            coordinate={{
                                latitude: parseFloat(assignPinLoc.latitude),
                                longitude: parseFloat(assignPinLoc.longitude)
                            }}
                            style={{alignItems: 'center'}}
                        >
                            <Image style={{width: 45, height: 45, resizeMode: 'contain'}} source={require('../assets/collection-pin.png')} />
                        </Marker>
                    </>
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
                                                            style={{alignItems: 'center'}}
                                                            onPress={() => {viewDistance !== loc.name ? setViewDistance(loc.name) : setViewDistance()}}
                                                        >
                                                            {viewDistance === loc.name &&
                                                                tempDistance.map((data) => {
                                                                    if(data.id === loc.name) {
                                                                        return (
                                                                            <View key={loc.name} style={{transform: [{translateY: 27}], zIndex: 99, backgroundColor: 'white', padding: 2, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', maxWidth: 300}}>
                                                                                <Text numberOfLines={1} style={{fontWeight: 500, fontSize: 12, color: 'green'}}>{loc.locationName}</Text>
                                                                                <Text style={{fontWeight: 500, fontSize: 12, color: '#F76811'}}>{data.distance} km away</Text>
                                                                            </View>
                                                                        );
                                                                    }
                                                                })
                                                            }
                                                            <Text style={{fontSize: 18, fontWeight: 900, color: 'green', transform: [{translateY: 26}], zIndex: 99}}>{parseInt(loc.name + 1)}</Text>
                                                            <Image style={{width: 45, height: 45, resizeMode: 'contain'}} source={require('../assets/collection-pin2.png')} />
                                                        </Marker>
                                                    );
                                                })
                                            );
                                        }
                                    })
                                );
                            }
                        })}

                        {allActiveTask.map((task) => {
                            if(task.userId === userID) {
                                return(
                                    allActiveRoute.map((route) => {
                                        if(route.activeTaskId === task.id) {
                                            let temp = [];
                                            for(let i = 1; i < route.taskRoute.length; i++) {
                                                temp.push(
                                                    <MapViewDirections
                                                        origin={{latitude: parseFloat(route.taskRoute[i-1].latitude), longitude: parseFloat(route.taskRoute[i-1].longitude)}}
                                                        destination={{latitude: parseFloat(route.taskRoute[i].latitude), longitude: parseFloat(route.taskRoute[i].longitude)}}
                                                        apikey={GOOGLE_API_KEY }
                                                        strokeWidth={3}
                                                        strokeColor='green'
                                                        key={i}
                                                    />
                                                );
                                            };
                                            return (temp);
                                        }
                                    })
                                );
                            }
                        })}
                    </>
                }

                {viewTrack &&
                    allShift.map((shift) => {
                        if(shift.id === taskToTrack.shiftId) {
                            return(
                                allColLocation.map((track) => {
                                    if(track.id === shift.trackId) {
                                        return(
                                            <Marker
                                                key={"Truck Location"}
                                                coordinate={{
                                                    latitude: parseFloat(track.latitude),
                                                    longitude: parseFloat(track.longitude)
                                                }}
                                                style={{zIndex: 99}}
                                            >
                                                <Image source={require('../assets/garbage-truck.png')} style={{width: 45, height: 45, resizeMode: 'contain', bottom: -5}} />
                                            </Marker>
                                        );
                                    }
                                })
                            );
                        }
                    })
                }

                {(viewTrack && taskToTrack.taskType === 'Assignment') &&
                    allSched.map((sched) => {
                        if(sched.id === taskToTrack.taskId) {
                            return(
                                <Marker
                                    key={'Assignment Pin'}
                                    coordinate={{
                                        latitude: parseFloat(sched.latitude),
                                        longitude: parseFloat(sched.longitude)
                                    }}
                                    style={{alignItems: 'center'}}
                                >
                                    <Image style={{width: 45, height: 45, resizeMode: 'contain'}} source={require('../assets/collection-pin.png')} />
                                </Marker>
                            );
                        }
                    })
                }

                {(viewTrack && taskToTrack.taskType === 'Collection') &&
                    <>
                        {allActiveTask.map((task) => {
                            if(task.taskId === taskToTrack.taskId) {
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
                                                            style={{alignItems: 'center'}}
                                                            onPress={() => {viewDistance !== loc.name ? setViewDistance(loc.name) : setViewDistance()}}
                                                        >
                                                            {viewDistance === loc.name &&
                                                                tempDistance.map((data) => {
                                                                    if(data.id === loc.name) {
                                                                        return (
                                                                            // <Text key={loc.name} style={{fontWeight: 500, fontSize: 12, color: '#F76811', transform: [{translateY: 27}], zIndex: 99, backgroundColor: 'white', padding: 2, paddingHorizontal: 5, borderRadius: 20}}>{data.distance} km away</Text>
                                                                            <View key={loc.name} style={{transform: [{translateY: 27}], zIndex: 99, backgroundColor: 'white', padding: 2, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', maxWidth: 300}}>
                                                                                <Text numberOfLines={1} style={{fontWeight: 500, fontSize: 12, color: 'green'}}>{loc.locationName}</Text>
                                                                                <Text style={{fontWeight: 500, fontSize: 12, color: '#F76811'}}>{data.distance} km away</Text>
                                                                            </View>
                                                                        );
                                                                    }
                                                                })
                                                            }
                                                            <Text style={{fontSize: 18, fontWeight: 900, color: 'green', transform: [{translateY: 26}], zIndex: 99}}>{parseInt(loc.name + 1)}</Text>
                                                            <Image style={{width: 45, height: 45, resizeMode: 'contain'}} source={require('../assets/collection-pin2.png')} />
                                                        </Marker>
                                                    );
                                                })
                                            );
                                        }
                                    })
                                );
                            }
                        })}

                        {allActiveTask.map((task) => {
                            if(task.taskId === taskToTrack.taskId) {
                                return(
                                    allActiveRoute.map((route) => {
                                        if(route.activeTaskId === task.id) {
                                            let temp = [];
                                            for(let i = 1; i < route.taskRoute.length; i++) {
                                                temp.push(
                                                    <MapViewDirections
                                                        origin={{latitude: parseFloat(route.taskRoute[i-1].latitude), longitude: parseFloat(route.taskRoute[i-1].longitude)}}
                                                        destination={{latitude: parseFloat(route.taskRoute[i].latitude), longitude: parseFloat(route.taskRoute[i].longitude)}}
                                                        apikey={GOOGLE_API_KEY }
                                                        strokeWidth={3}
                                                        strokeColor='green'
                                                        key={i}
                                                    />
                                                );
                                            };
                                            return (temp);
                                        }
                                    })
                                );
                            }
                        })}
                    </>
                }
{/* ========================================================================================================================================================================================================================================================================================================================================================================================================================================== */}
            </MapView>

            {allActiveTask.map((task) => {
                if(task.taskType === 'Assignment' && task.userId === userID) {
                    return (
                        allSched.map((sched) => {
                            if(sched.id === task.taskId && sched.collectionRecord.status === 'uncollected') {
                                return (
                                    <TouchableOpacity key={sched.id} onPress={() => {endAssignment(sched.id)}} activeOpacity={0.7} style={{position: 'absolute', backgroundColor: '#5E8E00', zIndex: 30, margin: 20, padding: 12, paddingHorizontal: 30, bottom: '10.5%', shadowColor: 'black', borderRadius: 100, shadowOffset:{width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 4, elevation: 4}}>
                                        <Text style={{color: 'white', fontWeight: 800}}>FINISH ASSIGNMENT</Text>
                                    </TouchableOpacity>
                                );
                            }
                        })
                    );
                }
            })}

            <DisplayRepInfo infoID={infoID} setInfoID={setInfoID} infoImage={infoImage} mapType={mapType} users={users} userUploads={userUploads} changeStatus={changeStatus} page={page} />

            {openTruckList && <MTruckList open={setOpenTruckList} collectorLocation={collectorLocation} collectorLoc={collectorLoc} users={users} />}
        
            {openTaskList && <TaskPanel open={setOpenTaskList} trackRoute={trackRoute} setShowColMarker={setShowColMarker} quickRoute={quickRoute} setShowDirection={setShowDirection} setShowFlag={setShowFlag} setShowAssignPin={setShowAssignPin} setAssignPinLoc={setAssignPinLoc} />}

            {openTaskListView && <TaskView open={setOpenTaskListView} setViewTrack={setViewTrack} setTaskToTrack={setTaskToTrack} />}
        </>
    ));   
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