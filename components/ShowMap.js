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

export default function LoadMap({ mapRef, page }) {
    const userRef = firebase.firestore().collection("users");
    const scheduleRef = firebase.firestore().collection("schedule");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");
    const collectorLocRef = firebase.firestore().collection("collectorLocationTrack");
    const colInProgressRef = firebase.firestore().collection("collectionInProgress");
    const collectorLoc = collection(db, "collectorLocationTrack");

    let userMun;
    
    const [mapType, setMapType] = useState('uncollected');
    const [infoID, setInfoID] = useState();
    const [infoImage, setInfoImage] = useState();
    const [openTruckList, setOpenTruckList] = useState(false);

    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [state, setState] = useState({ coordinates: [] });
    const [schedRoute, setSchedRoute] = useState([]);
    const [track, setTrack] = useState({ coordinates: [] });
    const [colInProgress, setColInProgress] = useState();
    const [collectorLocation, setCollectorLocation] = useState([]);




    // const usersCollection = collection(db, "users");

    // let searchLongitude, searchLatitude;
    // let colStatus;
    // let userId, description, location, dateTime;
    // let collectionIDTemp;

    // const [openSideBar, setOpenSideBar] = useState();
    // const [displayFlag, setDisplayFlag] = useState(false);
    // const [colMenu, setColMenu] = useState(false);

    // const [routeFlag, setRouteFlag] = useState([]);
    // const [colID, setColID] = useState();

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

            setSchedRoute(newData);

        };

        const unsubscribe = scheduleRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, [])

    // useEffect(() => {
    //     scheduleRef.onSnapshot(
    //         querySnapshot => {
    //             const uploads = []
    //             querySnapshot.forEach((doc) => {
    //                 const {collectionRoute, type, selectedDate, startTime} = doc.data();
    //                 uploads.push({
    //                     id: doc.id,
    //                     collectionRoute,
    //                     type,
    //                     selectedDate,
    //                     startTime
    //                 })
    //             })
    //             setSchedRoute(uploads)
    //         }
    //     )
    // }, [])

    useEffect(() => {
        const getMapData = async() => {
            userMun = await AsyncStorage.getItem('userMunicipality');
            LoadData(userMun, reportRef, imageColRef, collectorLocRef, colInProgressRef, mapType, setInfoID, users, setUserUploads, imageCol, setImageCol, setState, setTrack, setColInProgress, setCollectorLocation);
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

                {(page === 'Collector') &&
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenTruckList(true)}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                        <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='bus' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                        </View>
                    </TouchableOpacity>
                }

                <TouchableOpacity activeOpacity={0.5} onPress={() => {}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <View style={{height: 29, width: 29, borderRadius: 100, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='clipboard' style={{ fontSize: 18, top: 0, left: 1, color: 'orange' }} />
                    </View>
                </TouchableOpacity>

                {/* <TouchableOpacity activeOpacity={0.5} onPress={() => {setDisplayFlag(!displayFlag ? true : false); showRoute();}} style={{height: 40, width: 40, backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
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

                <RepMarker mapType={mapType} state={state} setInfoID={setInfoID} setInfoImage={setInfoImage} />

            </MapView>

            <DisplayRepInfo infoID={infoID} setInfoID={setInfoID} infoImage={infoImage} mapType={mapType} users={users} userUploads={userUploads} changeStatus={changeStatus} page={page} />

            {openTruckList && <MTruckList open={setOpenTruckList} collectorLocation={collectorLocation} collectorLoc={collectorLoc} users={users} />}
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