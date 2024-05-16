import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, navigate, Modal, FlatList, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../environments';

import PushNotif from '../../components/PushNotification';
import TruckList from '../../components/SchedTruckList';

export default function AddSched({navigation}) {

    const schedCollection = collection(db, "schedule");

    const [hourStart, setHourStart] = useState();
    const [minStart, setMinStart] = useState();
    const [ampmStart, setAmpmStart] = useState();
    const [selectType, setSelectType] = useState();
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [title, setTitle] = useState("");
    const [assignedTruck, setAssignedTruck]= useState("");
    const [selectedDate, setSelectedDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});
    
    const [selectColRoute, setSelectColRoute] = useState(false);
    const [addNewLocation, setAddNewLocation] = useState(false);
    let routeLongitude, routeLatitude, routeLocName;
    const [route, setRoute] = useState({ coordinates: [] });
    const [routeCtr, setRouteCtr] = useState(0);
    const [latitude, setLatitude] = useState();
    const [longitude, setLongitude] = useState();
    const [truckList, setTruckList] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    const [users, setUsers] = useState();
    const userRef = firebase.firestore().collection("users");

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
    }, []);

    const Type = [
        { key: "Collection", value: "Collection" },
        { key: "Assignment", value: "Assignment" },
        { key: "Event", value: "Event" },
    ];

    const Hour = [];
    let ctr2 = 0;
    for (let i = 1; i <= 12; i++) {
        Hour[ctr2] = { key: i, value: i };
        ctr2++;
    }

    const Min = [];
    let ctr3 = 0;
    for (let i = 0; i <= 9; i++) {
        Min[ctr3] = { key: ('0' + i), value: ('0' + i) };
        ctr3++;
    }
    for (let i = 10; i <= 59; i++) {
        Min[ctr3] = { key: i, value: i };
        ctr3++;
    }

    const AmpmTemp = [
        { key: "AM", value: "AM" },
        { key: "PM", value: "PM" },
    ];

    const clearData = async () => {
        setSelectType(null);
        setDescription("");
        setLocation("");
        setTitle("");
        setAssignedTruck("");
        setSelectedDate(null);
        setHourStart(null);
        setMinStart(null);
        setAmpmStart(null);
        setRouteCtr(0);
        setRoute({ coordinates: [] });
        setLatitude();
        setLongitude();
    }

    const getGarbageCollectors = async () => {
        const truckCollection = collection(db, 'trucks');
        const querySnapshot = await getDocs(truckCollection);
      
        const tempCollection = [];
        const code = await AsyncStorage.getItem('userLguCode');

        querySnapshot.forEach((doc) => {
          const tempData = doc.data();
          if(tempData.lguCode === code) {
            tempCollection.push({
              id: doc.id,
              dateTime: tempData.dateTime,
              driverID: tempData.driverID,
              lguCode: tempData.lguCode,
              lguID: tempData.lguID,
              members: tempData.members,
              plateNo: tempData.plateNo
            });
          }
        });
      
        return tempCollection;
    };
    
    useEffect(() => {
        // Fetch garbage collectors when component mounts
        const fetchCollectors = async () => {
            const collectors = await getGarbageCollectors();
            setTruckList(collectors);
        };
        fetchCollectors();
    }, []);

    const closeTruckModal = async() => {
        setModalVisible(false);
    }

    const handleSelectCollector = (collectorName) => {
        setAssignedTruck(collectorName);
        closeTruckModal();
    };

    const createSchedule = async () => {
        let newHourStart, newTitle;
        if (hourStart < 10) {
            newHourStart = "0" + hourStart;
        } else {
            newHourStart = hourStart;
        }

        let start = newHourStart + ":" + minStart + " " + ampmStart;
        // Default title if not provided
        if (title !== "") {
            newTitle = title;
        } else {
            newTitle = "N/A";
        }

        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');

        let id = await AsyncStorage.getItem('userId');
        // Generate a unique scheduleID
        const scheduleID = Math.random().toString(36).substring(2, 10);
        // Validate necessary values
        if (((location !== "" && latitude !== "" && longitude !== "") || route.coordinates.length !== 0) && setAssignedTruck !== "" && description !== "" && selectedDate) {
            if(selectType === 'Collection') {
                await addDoc(schedCollection, {
                    scheduleID: scheduleID, 
                    type: selectType,
                    description: description,
                    // location: '',
                    startTime: start,
                    // title: '',
                    userID: id,
                    assignedTruck: assignedTruck,
                    selectedDate: selectedDate,
                    collectionRoute: route,
                    // latitude: '',
                    // longitude: '',
                    dateTimeUploaded: fullDateTime,
                    collectionRecord: [],
                    visibility: 'enable'
                });

                let userFullName;
                users.map((user) => {
                    if(user.id.includes(id)) {
                        userFullName = user.firstName + ' ' + user.lastName;
                    }
                });

                const title = 'NEW COLLECTION SCHEDULE';
                const body = userFullName + ' has made a new garbage collection schedule';
                PushNotif(title, body, fullDateTime);

            } else if(selectType === 'Assignment') {
                await addDoc(schedCollection, {
                    scheduleID: scheduleID, 
                    type: selectType,
                    description: description,
                    location: location,
                    startTime: start,
                    // title: '',
                    userID: id,
                    assignedTruck: assignedTruck,
                    selectedDate: selectedDate,
                    // collectionRoute: { coordinates: [] },
                    latitude: latitude,
                    longitude: longitude,
                    dateTimeUploaded: fullDateTime,
                    collectionRecord: {
                        status: 'uncollected',
                        dateTimeCollected: ''
                    }
                });

                let userFullName;
                users.map((user) => {
                    if(user.id.includes(id)) {
                        userFullName = user.firstName + ' ' + user.lastName;
                    }
                });

                const title = 'NEW ASSIGNMENT SCHEDULED';
                const body = userFullName + ' has made a new garbage scheduled assignment';
                PushNotif(title, body, fullDateTime);

            } else if(selectType === 'Event') {
                await addDoc(schedCollection, {
                    scheduleID: scheduleID, 
                    type: selectType,
                    description: description,
                    location: location,
                    startTime: start,
                    title: newTitle,
                    userID: id,
                    // assignedTruck: '',
                    selectedDate: selectedDate,
                    // collectionRoute: { coordinates: [] },
                    latitude: latitude,
                    longitude: longitude,
                    dateTimeUploaded: fullDateTime
                });

                let userFullName;
                users.map((user) => {
                    if(user.id.includes(id)) {
                        userFullName = user.firstName + ' ' + user.lastName;
                    }
                });

                const title = 'NEW EVENT SCHEDULE';
                const body = userFullName + ' has scheduled a new event';
                PushNotif(title, body, fullDateTime);

            }

            alert("Schedule successfully added!");
            setMarkedDates((prevMarkedDates) => ({
                ...prevMarkedDates,
                [selectedDate]: { selected: true, selectedColor: getTypeColor(selectType) },
            }));

            clearData();
            navigation.navigate('mainSched');
        } else {
            alert("Fill up necessary values");
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Collection':
                return 'rgb(242, 190, 45)' ;
            case 'Assignment':
                return 'green';
            case 'Event':
                return 'rgb(134, 231, 237)';
        }
    };

    useEffect(() => {
        const fetchSchedules = async () => {
            const querySnapshot = await getDocs(collection(db, "schedule"));
            const schedules = [];
            querySnapshot.forEach((doc) => {
                const { type, selectedDate } = doc.data();
                schedules.push({ type, selectedDate });
            });
      
            const updatedMarkedDates = {};
            schedules.forEach(({ type, selectedDate }) => {
                updatedMarkedDates[selectedDate] = { selected: true, selectedColor: getTypeColor(type) };
            });
      
            setMarkedDates(updatedMarkedDates);
        };
      
        fetchSchedules();
      }, []);

    function SelectDateTime() {
        const markedDates = {};
        if (selectedDate) {
            markedDates[selectedDate] = { selected: true, selectedColor: 'green' };
        }

        return (
            <>
                <Text style={{marginLeft: 30, fontSize: 16, marginTop: 20}}>Select Date</Text>
                <View style={{width: "100%", justifyContent: "center" , alignItems:"center", marginTop: 10}}>
                <Calendar
                    style={{ width: 320, backgroundColor: 'white', borderRadius: 10, paddingBottom: 15, shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2,}, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,}}
                    markedDates={markedDates}
                    onDayPress={(day) => setSelectedDate(day.dateString)} // Capture selected date
                />
                </View>
                <View style={{width: '100%', paddingHorizontal: 25, flexDirection: 'row', gap: 18, marginTop: 25, justifyContent: 'flex-start', alignItems: 'center'}}>
                    <Text style={{fontSize: 16}}>Select Time:</Text>
                    <Text>{hourStart} : {minStart} {ampmStart}</Text>
                </View>
                <View style={{ flexDirection: "row", marginTop: 15, width: '100%', paddingLeft: 25 }}>
                    <SelectList
                        setSelected={(e) => { setHourStart(e); }}
                        data={Hour}
                        defaultOption={{ key: 1, value: '1' }}
                        boxStyles={{
                            width: 60,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            justifyContent: "center",
                            borderWidth: 0,
                        }}
                        dropdownStyles={{
                            width: 60,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                    />
                    <SelectList
                        setSelected={(e) => { setMinStart(e); }}
                        data={Min}
                        defaultOption={{ key: '00', value: '00' }}
                        boxStyles={{
                            width: 60,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            marginLeft: 10,
                            color: "rgba(45, 105, 35, 1)",
                            justifyContent: "center",
                            borderWidth: 0,
                        }}
                        dropdownStyles={{
                            width: 60,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 10,
                            marginLeft: 10,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                    />
                    <SelectList
                        setSelected={(e) => { setAmpmStart(e); }}
                        data={AmpmTemp}
                        defaultOption={{ key: 'AM', value: 'AM' }}
                        boxStyles={{
                            width: 70,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            marginLeft: 10,
                            color: "rgba(45, 105, 35, 1)",
                            justifyContent: "center",
                            borderWidth: 0,
                        }}
                        dropdownStyles={{
                            width: 70,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 10,
                            marginLeft: 10,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                    />
                </View>
            </>
        );
    }

    function CollectionRoute() {
        const editRoute = async (name, newLat, newLon) => {
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: parseFloat(newLat),
                    longitude: parseFloat(newLon)
                });
                let finalAddress = '';
                if(address[0].streetNumber !== null)
                    finalAddress = finalAddress + address[0].streetNumber + ', ';
                if(address[0].street !== null)
                    finalAddress = finalAddress + address[0].street + ', ';
                if(address[0].name !== null)
                    finalAddress = finalAddress + address[0].name + ', ';
                if(address[0].district !== null)
                    finalAddress = finalAddress + address[0].district + ', ';
                if(address[0].city !== null)
                    finalAddress = finalAddress + address[0].city + ', ';
                if(address[0].subregion !== null)
                    finalAddress = finalAddress + address[0].subregion + ', ';
                if(address[0].region !== null)
                    finalAddress = finalAddress + address[0].region + ' region, ';
                if(address[0].country !== null)
                    finalAddress = finalAddress + address[0].country;
                // setLocation(finalAddress);
                setRoute({ 
                    coordinates: route.coordinates.map((coordinate) => 
                        coordinate.name === name ? {
                            ...coordinate,
                            locationName: finalAddress,
                            latitude: newLat,
                            longitude: newLon
                        } : coordinate
                    )
                });
            } catch(e) {console.log(e)}
        }

        function ShowRoute() {
            let temp = [];
            route.coordinates.map((coord) => {
                temp.push(
                    <View style={{backgroundColor: '#F7F1E7', padding: 10, borderRadius: 5, display: 'flex', flex: 1, flexDirection: 'row'}}>
                        <View style={{flex: 10, justifyContent: 'center'}}>
                            <Text ellipsizeMode='tail' numberOfLines={1} style={{color: '#7E430F', margin: 0, padding: 0, paddingRight: 10, fontWeight: 600}}>{coord.locationName}</Text>
                            <View style={{flexDirection: 'row', marginTop: 5}}>
                                <View style={{flex: 1}}>
                                    <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 12, paddingRight: 15, fontWeight: 600}}>Lat: <Text style={{fontWeight: 'normal'}}>{coord.latitude}</Text></Text>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 12, paddingRight: 15, fontWeight: 600}}>Lon: <Text style={{fontWeight: 'normal'}}>{coord.longitude}</Text></Text>
                                </View>
                            </View>
                        </View>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {
                                setRoute({
                                    coordinates: route.coordinates.filter((coordinate) => coordinate.name !== coord.name),
                                });
                            }}>
                                <Ionicons name='trash' style={{fontSize: 25, color: '#E19036'}} />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            });

            <ul>
                {temp.map(item =>
                    <li key="{item}">{item}</li>
                )}
            </ul>

            return (
                <View style={{width: '100%', gap: 5, paddingHorizontal: 5}}>
                    {temp}
                </View>
            );
        }

        return (
            <>
                {selectColRoute ?
                    <View style={{width: '100%', paddingHorizontal: 25, marginTop: 10, alignItems: 'center'}}>
                        <TouchableOpacity style={{width: '90%', marginBottom: 10, backgroundColor: 'white', shadowColor: 'black', shadowOpacity: 0.7, shadowRadius: 2, elevation: 2, borderRadius: 15}} activeOpacity={0.5} onPress={() => {setSelectColRoute(false)}}>
                            <View style={{width: '100%', height: 20, backgroundColor: '#F3F3F3', borderRadius: 15, borderWidth: 0.5, borderColor: '#C5C5C5', justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 12}}>Collapse Routing Menu</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={{width: '100%', alignItems: 'flex-end', gap: 5}}>
                            <View style={{width: '100%', height: 300, overflow: 'hidden', borderRadius: 10, borderWidth: 0.5}}>
                                <MapView
                                    style={{width: '100%', height: '120%'}}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={{
                                        latitude: 10.3156992,
                                        longitude: 123.88543660000005,
                                        latitudeDelta: 0.0922,
                                        longitudeDelta: 0.0421,
                                    }}
                                    customMapStyle={mapStyle}
                                >
                                    {route.coordinates.map(marker => (
                                        <Marker
                                            key={marker.name}
                                            coordinate={{
                                                latitude: parseFloat(marker.latitude),
                                                longitude: parseFloat(marker.longitude)
                                            }}
                                            style={{zIndex: 95}}
                                            draggable
                                            onDragEnd={(e) => {
                                                editRoute(marker.name, e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                                            }}
                                        >
                                            <Ionicons name='flag' style={{fontSize: 25, color: '#D41818'}} />    
                                        </Marker>
                                    ))}
                                </MapView>
                            </View>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {setAddNewLocation(true)}}>
                                <View style={{width: 35, height: 35, backgroundColor: 'orange', borderRadius: 5, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
                                    <Text style={{fontSize: 40, fontWeight: 500, color: 'white', marginTop: -11}}>+</Text>
                                </View>
                            </TouchableOpacity>
                            {ShowRoute()}
                        </View>
                    </View>
                    :
                    <View style={{width: '100%', paddingHorizontal: 25, marginTop: 10, alignItems: 'center'}}>
                        <TouchableOpacity style={{width: '90%', backgroundColor: 'white', shadowColor: 'black', shadowOpacity: 0.7, shadowRadius: 2, elevation: 2, borderRadius: 15}} activeOpacity={0.5} onPress={() => {setSelectColRoute(true)}}>
                            <View style={{width: '100%', height: 20, backgroundColor: '#F3F3F3', borderRadius: 15, borderWidth: 0.5, borderColor: '#C5C5C5', justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 12}}>Expand Routing Menu</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                }
            </>
        );
    }

    function Collection() {
        return (
            <>
                <View style={{ width: '100%', paddingHorizontal: 25 }}>
                    <TextInput
                        value ={description}
                        style={{
                            height: 150,
                            width: '100%',
                            backgroundColor: 'rgb(231,247,233)',
                            borderRadius: 5,
                            borderWidth: 0.5,
                            borderColor: "rgb(215,233,217)",
                            color: "rgba(45, 105, 35, 1)",
                            padding: 15,
                            paddingRight: 8,
                            textAlignVertical: 'top',
                        }}
                        placeholder='Add Description'
                        onChangeText={(e)=>{setDescription(e)}}
                        multiline={true}
                    />
                </View>
                <View style={{ width: '100%', paddingHorizontal: 25, marginTop: 5 }}>
                    <TextInput
                    style={{
                        height: 40,
                        width: '100%',
                        backgroundColor: 'rgb(231,247,233)',
                        borderRadius: 5,
                        borderWidth: 0.5,
                        borderColor: 'rgb(215,233,217)',
                        color: 'rgba(45, 105, 35, 1)',
                        paddingLeft: 15,
                    }}
                    placeholder='Select Garbage Truck to Assign'
                    value={assignedTruck}
                    onFocus={() => setModalVisible(true)}
                    />
                </View>
                {CollectionRoute()}
                {SelectDateTime()}
                
                {(modalVisible === true) && <TruckList close={closeTruckModal} dataList={truckList} selected={handleSelectCollector} />}
            </>
        );
    }

    function Assignment() {
        return (
            <>
              <View style={{ width: '100%', paddingHorizontal: 25 }}>
                <TextInput
                  value={description}
                  style={{
                    height: 150,
                    width: '100%',
                    backgroundColor: 'rgb(231,247,233)',
                    borderRadius: 5,
                    borderWidth: 0.5,
                    borderColor: 'rgb(215,233,217)',
                    color: 'rgba(45, 105, 35, 1)',
                    padding: 15,
                    paddingRight: 8,
                    textAlignVertical: 'top',
                  }}
                  placeholder='Add Description'
                  onChangeText={(e) => {
                    setDescription(e);
                  }}
                  multiline={true}
                />
              </View>
        
              <View style={{ width: '100%', paddingHorizontal: 25, marginTop: 5 }}>
                <TextInput
                  style={{
                    height: 40,
                    width: '100%',
                    backgroundColor: 'rgb(231,247,233)',
                    borderRadius: 5,
                    borderWidth: 0.5,
                    borderColor: 'rgb(215,233,217)',
                    color: 'rgba(45, 105, 35, 1)',
                    paddingLeft: 15,
                  }}
                  placeholder='Select Garbage Truck to Assign'
                  value={assignedTruck}
                  onFocus={() => setModalVisible(true)}
                />
              </View>
        
              <View style={{ width: '100%', paddingHorizontal: 25, marginTop: 5 }}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => setAddNewLocation(true)}>
                  <TextInput
                    value={location}
                    style={{
                      height: 40,
                      width: '100%',
                      backgroundColor: 'rgb(231,247,233)',
                      borderRadius: 5,
                      borderWidth: 0.5,
                      borderColor: 'rgb(215,233,217)',
                      color: 'rgba(45, 105, 35, 1)',
                      paddingLeft: 15,
                    }}
                    placeholder='Select Assignment Location'
                    editable={false}
                  />
                </TouchableOpacity>
              </View>
        
              {SelectDateTime()}

              {(modalVisible === true) && <TruckList close={closeTruckModal} dataList={truckList} selected={handleSelectCollector} />}
            </>
          );
        }

    function Event() {
        return (
            <>
                <View style={{width: '100%', paddingHorizontal: 25}}>
                    <TextInput
                        value ={title}
                        style={{
                            height: 40,
                            width: '100%',
                            backgroundColor: 'rgb(231,247,233)',
                            borderRadius: 5,
                            borderWidth: 0.5,
                            borderColor: "rgb(215,233,217)",
                            color: "rgba(45, 105, 35, 1)",
                            paddingLeft: 15,
                        }}
                        placeholder='Add Title'
                        onChangeText={(e)=>{setTitle(e)}}

                    />
                </View>
                <View style={{ width: '100%', paddingHorizontal: 25, marginTop: 5 }}>
                    <TextInput
                        value ={description}
                        style={{
                            height: 150,
                            width: '100%',
                            backgroundColor: 'rgb(231,247,233)',
                            borderRadius: 5,
                            borderWidth: 0.5,
                            borderColor: "rgb(215,233,217)",
                            color: "rgba(45, 105, 35, 1)",
                            padding: 15,
                            paddingRight: 8,
                            textAlignVertical: 'top',
                        }}
                        placeholder='Add Description'
                        onChangeText={(e)=>{setDescription(e)}}
                        multiline={true}
                    />
                </View>
                <View style={{width: '100%', paddingHorizontal: 25, marginTop: 5}}>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setAddNewLocation(true)}}>
                        <TextInput
                            value={location}
                            style={{
                                height: 40,
                                width: '100%',
                                backgroundColor: 'rgb(231,247,233)',
                                borderRadius: 5,
                                borderWidth: 0.5,
                                borderColor: "rgb(215,233,217)",
                                color: "rgba(45, 105, 35, 1)",
                                paddingLeft: 15,
                            }}
                            placeholder='Select Location'
                            editable = {false}
                        />
                    </TouchableOpacity>
                </View>
                {SelectDateTime()}
            </>
        );
    }

    function DisplayType() {
        if (selectType === 'Collection') {
            return (
                <>
                    {Collection()}
                </>
            );
        }
        if (selectType === 'Assignment') {
            return (
                <>
                    {Assignment()}
                </>
            );
        }
        if (selectType === 'Event') {
            return (
                <>
                    {Event()}
                </>
            );
        }
    }

    return (
        <>
            <View style={{ position: "absolute", height: "100%", width: "100%", justifyContent: "flex-start", alignItems: "center", zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.85)", }}>
                <View style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}>
                    <ScrollView style={{ width: "100%" }} contentContainerStyle={{ alignItems: 'flex-start', paddingTop: 90, }}>
                        <View style={{ position: "absolute", width: "100%", alignItems: "flex-start", top: 30, left: 20, zIndex: 10, }}>
                            <TouchableOpacity onPress={() => { clearData(); navigation.navigate('mainSched'); }}>
                                <Ionicons name="arrow-back" style={{ fontSize: 40, color: "rgb(179,229,94)" }} />
                            </TouchableOpacity>
                        </View>
                        <Text style={{marginBottom: 5, fontSize: 25, fontWeight: 900, color: 'rgba(113, 112, 108, 1)', width: '100%', paddingLeft: 25}}>CREATE TASK</Text>
                        <View style={{width: '100%', paddingHorizontal: 25, marginBottom: 10}}>
                            <SelectList
                                setSelected={(e) => { setSelectType(e); }}
                                data={Type}
                                placeholder="Select Type"
                                boxStyles={{
                                    width: '100%',
                                    backgroundColor: "rgb(189,228,124)",
                                    borderRadius: 10,
                                    color: "rgba(45, 105, 35, 1)",
                                    justifyContent: "center",
                                    borderWidth: 0,
                                }}
                                dropdownStyles={{
                                    width: '100%',
                                    backgroundColor: "rgb(231,247,233)",
                                    top: -18,
                                    marginBottom: -10,
                                    borderRadius: 5,
                                    zIndex: -1,
                                    borderWidth: 0,
                                    alignSelf: 'center',
                                }}
                                search={false}
                            />
                        </View>
                        {DisplayType()}
                        <View style={{width: '100%', marginTop: 30, marginBottom: 90, alignItems: 'center'}}>
                            <View style={styles.button}>
                                <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={()=>{createSchedule();}}>
                                    <Text style={styles.buttonTxt}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
            {addNewLocation ?
                <View style={{position: 'absolute', zIndex: 99, height: '100%', width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{width: '100%', height: 120, backgroundColor: 'white', padding: 20, borderRadius: 10, justifyContent: 'flex-end'}}>
                        <View style={{width: '113%', position: 'absolute', paddingHorizontal: 20, paddingTop: 20, top: 0, zIndex: 100}}>
                            <GooglePlacesAutocomplete
                                placeholder='Search'
                                fetchDetails
                                enablePoweredByContainer={false}
                                onPress={(data, details = null) => {
                                    routeLatitude = details.geometry.location.lat;
                                    routeLongitude = details.geometry.location.lng;
                                    routeLocName = data.description;
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
                        <View style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
                            <TouchableOpacity 
                                activeOpacity={0.5}
                                onPress={() => {
                                    if(routeLocName !== undefined && routeLatitude !== undefined && routeLongitude !== undefined) {
                                        if(selectType === 'Collection') {
                                            (async() => {
                                                let {status} = await Location.requestForegroundPermissionsAsync();
                                                if (status !== 'granted') {
                                                    setErrorMsg('Permission to access location was denied');
                                                    return;
                                                }
                                            })();
                                            setRoute((prev) => ({
                                                ...prev,
                                                coordinates: [...prev.coordinates, {name: routeCtr, latitude: routeLatitude, longitude: routeLongitude, locationName: routeLocName}]
                                            }));
                                            setRouteCtr(routeCtr + 1);
                                        } else if(selectType === 'Assignment') {
                                            setLocation(routeLocName);
                                            setLatitude(routeLatitude);
                                            setLongitude(routeLongitude);
                                        } else if(selectType === 'Event') {
                                            setLocation(routeLocName);
                                            setLatitude(routeLatitude);
                                            setLongitude(routeLongitude);
                                        }
                                    }
                                    setAddNewLocation(false);
                                }}
                            >
                                <View style={{backgroundColor: 'green', padding: 5, width: 70, alignItems: 'center', borderRadius: 5}}>
                                    <Text>Add</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {setAddNewLocation(false)}}>
                                <View style={{backgroundColor: 'red', padding: 5, width: 70, alignItems: 'center', borderRadius: 5}}>
                                    <Text>Close</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                :
                <></>
            }
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 157,
        height: 45,
        backgroundColor: 'rgb(0,123,0)',
        borderRadius: 100,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 3,
    },
    buttonTxt: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgb(81,175,91)',
        textAlign: 'center',
        padding: 10,
        verticalAlign: 'middle',
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
    },
})

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