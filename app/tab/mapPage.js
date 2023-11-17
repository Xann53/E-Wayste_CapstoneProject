import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../environments';
import SideBar from '../../components/SideNav';

export default function Map({ navigation }) {
    const isFocused = useIsFocused();
    const [openSideBar, setOpenSideBar] = useState();
    const mapRef = useRef(null);
    let searchLongitude, searchLatitude;

    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [state, setState] = useState({ coordinates: [] });

    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");

    const [currentLat, setCurrentLat] = useState(null);
    const [currentLon, setCurrentLon] = useState(null);

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
    }, []);

    function loadMap() {
        const reload = () => {
            setState({ coordinates: [] });
            userUploads.map((pin) => {
                let imageURL;
                imageCol.map((url) => {
                    if(url.includes(pin.associatedImage)) {
                        imageURL = url;
                    }
                })
                try {
                    const lat = parseFloat(pin.latitude);
                    const long = parseFloat(pin.longitude);
                    setState((prevState) => ({
                        ...prevState,
                        coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                    }));
                } catch (e) {
                    console.log(e);
                }
            })
        }

        const quickRoute = () => {
            (async() => {
                let {status} = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }
                let currentLocation = await Location.getCurrentPositionAsync({});
                setCurrentLat(currentLocation.coords.latitude);
                setCurrentLon(currentLocation.coords.longitude);
            })();
        }

        return (
            <>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {reload()}} style={{position: 'absolute', height: 40, width: 40, backgroundColor: 'orange', top: 20, right: 15, zIndex: 99, justifyContent: 'center', alignItems: 'center', borderRadius: 100, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,}}>
                    <Ionicons name='refresh-circle' style={{ fontSize: 30, top: 0, left: 1, color: 'white' }} />
                </TouchableOpacity>
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
                >
                    {state.coordinates.map(marker => (
                        <Marker
                            key={marker.name}
                            coordinate={{
                                latitude: parseFloat(marker.latitude),
                                longitude: parseFloat(marker.longitude)
                            }}
                            title='My Location'
                            onCalloutPress={() => {quickRoute(); console.log(marker.latitude); console.log(marker.longitude);}}
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
                </MapView>
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
                            console.log('Latitude:', searchLatitude);
                            console.log('Longitude:', searchLongitude);
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