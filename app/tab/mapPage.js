import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../environments';
import SideBar from '../../components/SideNav';

export default function MapAut({ navigation }) {
    const isFocused = useIsFocused();
    const [openSideBar, setOpenSideBar] = useState();
    const mapRef = useRef(null);
    let searchLongitude, searchLatitude;
    const [mapType, setMapType] = useState('uncollected');

    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [collectorLocation, setCollectorLocation] = useState([]);
    const [state, setState] = useState({ coordinates: [] });
    const [track, setTrack] = useState({ coordinates: [] });

    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const collectorLocRef = firebase.firestore().collection("collectorLocationTrack");
    const imageColRef = ref(storage, "postImages/");

    const [infoID, setInfoID] = useState();
    const [infoImage, setInfoImage] = useState();
    let colStatus;

    let userId
    let description
    let location
    let dateTime
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
            trackCollectors();
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
            trackCollectors();
        }

        const trackCollectors = async() => {
            setInterval(async() => {
                setTrack({ coordinates: [] });
                collectorLocation.map((pin) => {
                    let collector;
                    users.map((user) => {
                        if(user.id.includes(pin.userId)) {
                            collector = user.firstName + ' ' + user.lastName;
                        }
                    })
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
                })
            }, 5000)
        }

        return (
            <>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {reload()}} style={{position: 'absolute', height: 40, width: 40, backgroundColor: 'orange', top: 20, right: 15, zIndex: 99, justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <Ionicons name='refresh-circle' style={{ fontSize: 30, top: 0, left: 1, color: 'white' }} />
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
                                    onPress={() => {setInfoID(marker.name); setInfoImage(marker.image)}}
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

                    {track.coordinates.map(marker => (
                        <Marker
                            key={marker.name}
                            coordinate={{
                                latitude: parseFloat(marker.latitude),
                                longitude: parseFloat(marker.longitude)
                            }}
                            style={{zIndex: 95}}
                        >
                            <Ionicons name='location' style={{fontSize: 30, color: 'green'}} />
                            <Callout>
                                <View style={{width: 150, alignItems: 'center'}}>
                                    <Text>Collector: {marker.collectorName}</Text>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
                {infoID ?
                    <View style={{position: 'absolute', backgroundColor: 'white', zIndex: 99, height: 150, width: '90%', padding: 5, bottom: '10.5%', shadowColor: 'black', borderRadius: 15, shadowOffset:{width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 4, elevation: 4}}>
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
                                                <View style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden', backgroundColor: 'orange', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'white'}}>UNCOLLECTED</Text>
                                                </View>
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
                <View style={{ position: 'absolute', right: 20, bottom: 78, zIndex: 10, height: 60, width: 60, borderRadius: 100, backgroundColor: '#ffffff', borderWidth: 0.5, borderColor: 'rgb(0,0,0)', overflow: 'hidden' }}>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {navigation.navigate('camera')}}>
                        <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='add-circle' style={{ fontSize: 60, color: 'rgb(255,203,60)', top: -2.3, right: -1.2 }} />
                        </View>
                    </TouchableOpacity>
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