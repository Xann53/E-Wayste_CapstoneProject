import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Modal, FlatList } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db, firebase } from '../../firebase_config';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import DatePicker from 'react-native-datepicker';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../environments';
import * as Location from 'expo-location';

export default function ViewSchedDetails({ navigation, route }) {
  const { scheduleId } = route.params;
  const [scheduleData, setScheduleData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addNewLocation, setAddNewLocation] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [collectorList, setCollectorList] = useState([]);
  const [assignCollector, setAssignCollector]= useState("");
  const [assignedTruck, setAssignedTruck] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectColRoute, setSelectColRoute] = useState(false);
  let routeLongitude, routeLatitude, routeLocName;
  const [route2, setRoute2] = useState({ coordinates: [] });
  const [routeCtr, setRouteCtr] = useState(0);
  const [latitude, setLatitude] = useState();
  const [longitude, setLongitude] = useState();
  const [location, setLocation] = useState("");
  const schedRef = firebase.firestore().collection("schedule");
  const [schedRoute, setSchedRoute] = useState();
  const [route, setRoute] = useState({ coordinates: [] });
  const [truckList, setTruckList] = useState([]);
  let from, to;

  useEffect(() => {
    const onSnapshot = snapshot => {
        const newData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        setSchedRoute(newData);

    };

    const unsubscribe = schedRef.onSnapshot(onSnapshot);

    return () => {
        unsubscribe();
    };
}, []);

useEffect(() => {
  const fetchSchedule = async () => {
      const scheduleRef = doc(db, 'schedule', scheduleId);
      const unsubscribe = onSnapshot(scheduleRef, (doc) => {
          if (doc.exists()) {
              const scheduleData = doc.data();
              setScheduleData(scheduleData);
              setUpdatedData(scheduleData);
          } else {
              setScheduleData(null);
              setUpdatedData({});
          }
      });
      return () => unsubscribe();
    };
    fetchSchedule();
  }, [scheduleId]);

  const getGarbageCollectors = async () => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
  
    const collectorList = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.accountType === 'Garbage Collector') {
        collectorList.push({
          id: doc.id,
          name: userData.username,
        });
      }
    });
  
    return collectorList;
  };

  useEffect(() => {
    // Fetch garbage collectors when component mounts
    const fetchCollectors = async () => {
      const collectors = await getGarbageCollectors();
      setCollectorList(collectors);
    };
    fetchCollectors();
  }, []);

  const handleSelectCollector = (collectorName) => {
    setAssignCollector(collectorName);
    setModalVisible(false);
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'schedule', scheduleId), updatedData);
      alert('Schedule successfully updated!');
      setIsEditable(false);
    } catch (error) {
      console.log('Error updating schedule:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'schedule', scheduleId));
      alert('Schedule successfully deleted!');
      navigation.navigate('mainSched');
    } catch (error) {
      console.log('Error deleting schedule:', error);
    }
  };

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    if (fieldName === 'type') {
      setShowDropdown(true);
    } else if (fieldName === 'startTime' && isEditable) {
      showTimePicker();
    } else if (fieldName === 'selectedDate' && isEditable) {
      showDatePicker();
    } else {
      setShowDropdown(false);
    }
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
    setShowDropdown(false);
  };

  const resetEdit = () => {
    setIsEditable(false);
    setUpdatedData(scheduleData);
  };

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  const handleTimeConfirm = (time) => {
    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time without milliseconds
    setSelectedTime(formattedTime);
    hideTimePicker();
    setUpdatedData({ ...updatedData, startTime: formattedTime });
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setSelectedDate(formattedDate);
    hideDatePicker();
    setUpdatedData({ ...updatedData, selectedDate: formattedDate });
  };

  const updateRoute = async() => {
    const schedDocRef = doc(db, "schedule", scheduleId);
    const newFields = {
      collectionRoute: route2
    };
    await updateDoc(schedDocRef, newFields);
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
            setRoute2({ 
                coordinates: route2.coordinates.map((coordinate) => 
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
        route2.coordinates.map((coord) => {
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
                            setRoute2({
                                coordinates: route2.coordinates.filter((coordinate) => coordinate.name !== coord.name),
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
                <View style={{width: 310, marginTop: 10, alignItems: 'center'}}>
                    <TouchableOpacity style={{width: '100%', marginBottom: 10, backgroundColor: 'white', shadowColor: 'black', shadowOpacity: 0.7, shadowRadius: 2, elevation: 2, borderRadius: 15}} activeOpacity={0.5} onPress={() => {setSelectColRoute(false)}}>
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
                                {route2.coordinates.map(marker => (
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
                <View style={{width: 310, marginTop: 10, alignItems: 'center'}}>
                    <TouchableOpacity style={{width: '100%', backgroundColor: 'white', shadowColor: 'black', shadowOpacity: 0.7, shadowRadius: 2, elevation: 2, borderRadius: 15}} activeOpacity={0.5} onPress={() => {setSelectColRoute(true)}}>
                        <View style={{width: '100%', height: 20, backgroundColor: '#F3F3F3', borderRadius: 15, borderWidth: 0.5, borderColor: '#C5C5C5', justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 12}}>Expand Routing Menu</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            }
        </>
    );
  }
  

  return (
    <>
      <View style={{ position: "absolute", height: "100%", width: "100%", justifyContent: "flex-start", alignItems: "center", zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <View style={{ position: "absolute", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", top: 30, paddingHorizontal: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => { resetEdit(); navigation.navigate('mainSched'); }}>
            <Ionicons name="arrow-back" style={{ fontSize: 40, color: "rgb(179, 229, 94)" }} />
          </TouchableOpacity>
          {!isEditable ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={handleEdit}>
                <Ionicons name="pencil" style={{ fontSize: 25, color: "rgb(179, 229, 94)", marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash" style={{ fontSize: 25, color: "rgb(179, 229, 94)" }} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => {
              handleUpdate();
              if(updatedData.type === "Collection") {
                updateRoute();
              }
            }}>
              <Ionicons name="checkmark" style={{ fontSize: 35, color: "rgb(179, 229, 94)"}} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}>
          <ScrollView style={{ width: "100%" }} contentContainerStyle={{ alignItems: 'flex-start', paddingTop: 90, }}>
            <Text style={{ marginBottom: 5, fontSize: 25, fontWeight: 'bold', color: '#0D5601', width: '100%', paddingLeft: 25 }}>SCHEDULE DETAILS</Text>
            {scheduleData && (
              <>
                {scheduleData.type && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Type</Text>
                    {isEditable ? (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={updatedData.type}
                          onValueChange={(value) => setUpdatedData({ ...updatedData, type: value })}
                          style={styles.picker}
                          enabled={isEditable}
                        >
                          <Picker.Item label="Collection" value="Collection" />
                          <Picker.Item label="Event" value="Event" />
                          <Picker.Item label="Assignment" value="Assignment" />
                        </Picker>
                      </View>
                    ) : (
                      <Text style={styles.fieldValue}>{updatedData.type}</Text>
                    )}
                  </View>
                )}
                {/* Common fields */}
                {scheduleData.description && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Description</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'description' && styles.focusedField]}
                      value={updatedData.description}
                      editable={isEditable && (updatedData.type === 'Collection' || updatedData.type === 'Assignment')}
                      multiline={true}
                      onFocus={() => handleFieldFocus('description')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, description: text })}
                    />
                  </View>
                )}
                {scheduleData.assignedTruck && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Assigned Truck</Text>
                        <TextInput
                          style={[styles.fieldValue, focusedField === 'assignedTruck' && styles.focusedField]}
                          value={updatedData.assignedTruck}
                          onFocus={() => setModalVisible(true)}
                          editable={isEditable}
                          onBlur={handleFieldBlur}
                          onChangeText={(text) => setUpdatedData({ ...updatedData, assignedTruck: text })}
                        />
                      </View>
                    )}
                {(updatedData.type === 'Event' || updatedData.type === 'Assignment') && (
                    <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Location</Text>
                    {isEditable ? (
                      <TouchableOpacity
                        style={[styles.fieldValue, focusedField === 'location' && styles.focusedField]}
                        onPress={() => setAddNewLocation(true)} // Trigger addNewLocation when editing the location
                      >
                        <Text>{updatedData.location}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.fieldValue}>{updatedData.location}</Text>
                    )}
                  </View>
                )}
                {/* Collection-specific fields */}
                {updatedData.type === 'Collection' && (
                  <>
                    {scheduleData.type && scheduleData.type === 'Collection' && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldName}>Collection Route</Text>
                            {scheduleData.collectionRoute.coordinates.map((coordinate, index) => (
                                <Text key={index} style={styles.fieldValue}>
                                    <Ionicons name="location" size={20} color="red" style={{ marginRight: 5 }} />
                                    {coordinate.locationName}
                                </Text>
                            ))}
                        </View>
                    )}
                    {scheduleData.selectedDate && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Date</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'selectedDate' && styles.focusedField]}
                            onPress={showDatePicker}
                          >
                            <Text>{(selectedDate || updatedData.selectedDate) && (selectedDate || updatedData.selectedDate)}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{selectedDate || updatedData.selectedDate}</Text>
                        )}
                      </View>
                    )}
                    {scheduleData.startTime && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Time</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'startTime' && styles.focusedField]}
                            onPress={() => handleFieldFocus('startTime')}
                          >
                            <Text>{selectedTime || updatedData.startTime}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{updatedData.startTime}</Text>
                        )}
                      </View>
                    )}
                  </>
                )}
                {updatedData.type === 'Assignment' && (
                  <>
                    {scheduleData.title && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Title</Text>
                        <TextInput
                          style={[styles.fieldValue, focusedField === 'title' && styles.focusedField]}
                          value={updatedData.title}
                          editable={isEditable}
                          onFocus={() => handleFieldFocus('title')}
                          onBlur={handleFieldBlur}
                          onChangeText={(text) => setUpdatedData({ ...updatedData, title: text })}
                        />
                      </View>
                    )}            
                    {scheduleData.selectedDate && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Date</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'selectedDate' && styles.focusedField]}
                            onPress={showDatePicker}
                          >
                            <Text>{(selectedDate || updatedData.selectedDate) && (selectedDate || updatedData.selectedDate)}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{selectedDate || updatedData.selectedDate}</Text>
                        )}
                      </View>
                    )}
                    {scheduleData.startTime && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Time</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'startTime' && styles.focusedField]}
                            onPress={() => handleFieldFocus('startTime')}
                          >
                            <Text>{selectedTime || updatedData.startTime}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{updatedData.startTime}</Text>
                        )}
                      </View>
                    )}   
                  </>
                )}
                {/* Event-specific fields */}
                {updatedData.type === 'Event' && (
                  <>
                    {scheduleData.title && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Title</Text>
                        <TextInput
                          style={[styles.fieldValue, focusedField === 'title' && styles.focusedField]}
                          value={updatedData.title}
                          editable={isEditable}
                          onFocus={() => handleFieldFocus('title')}
                          onBlur={handleFieldBlur}
                          onChangeText={(text) => setUpdatedData({ ...updatedData, title: text })}
                        />
                      </View>
                    )}                  
                    {scheduleData.selectedDate && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Date</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'selectedDate' && styles.focusedField]}
                            onPress={showDatePicker}
                          >
                            <Text>{(selectedDate || updatedData.selectedDate) && (selectedDate || updatedData.selectedDate)}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{selectedDate || updatedData.selectedDate}</Text>
                        )}
                      </View>
                    )}
                    {scheduleData.startTime && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Time</Text>
                        {isEditable ? (
                          <TouchableOpacity
                            style={[styles.fieldValue, focusedField === 'startTime' && styles.focusedField]}
                            onPress={() => handleFieldFocus('startTime')}
                          >
                            <Text>{selectedTime || updatedData.startTime}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fieldValue}>{updatedData.startTime}</Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
      {isTimePickerVisible && (
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
        />
      )}
    {isDatePickerVisible && (
        <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
      )}
      <Modal visible={modalVisible} animationType='slide' transparent={true}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgb(231,247,233)', width: 310, padding: 20, borderRadius: 10, elevation: 5, borderWidth: 1, borderColor: 'green'}}>
                    <FlatList
                      data={collectorList}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleSelectCollector(item.name)}>
                          <Text style={{ fontSize: 16, marginBottom: 10 }}>{item.name}</Text>
                        </TouchableOpacity>
                      )}
                    />
                    {/* Close modal button */}
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Text style={{ fontSize: 12, color: 'blue', marginTop: 10 }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
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
                                        if(updatedData.type === 'Collection') {
                                            (async() => {
                                                let {status} = await Location.requestForegroundPermissionsAsync();
                                                if (status !== 'granted') {
                                                    setErrorMsg('Permission to access location was denied');
                                                    return;
                                                }
                                            })();
                                            setRoute2((prev) => ({
                                                ...prev,
                                                coordinates: [...prev.coordinates, {name: routeCtr, latitude: routeLatitude, longitude: routeLongitude, locationName: routeLocName}]
                                            }));
                                            setRouteCtr(routeCtr + 1);
                                        } else if(updatedData.type === 'Assignment') {
                                            setLocation(routeLocName);
                                            setLatitude(routeLatitude);
                                            setLongitude(routeLongitude);
                                        } else if(updatedData.type === 'Event') {
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
  fieldContainer: {
    paddingHorizontal: 25,
    marginTop: 10,
    flexDirection: 'column',
  },
  fieldName: {
    fontWeight: 'bold',
    marginRight: -30,
    width: 150,
    fontSize: 16,
  },
  fieldValue: {
    backgroundColor: 'rgb(231,247,233)',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgb(215,233,217)',
    color: 'rgba(45, 105, 35, 1)',
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    marginTop: 5,
    width: 310,
    height: 35,
    justifyContent: 'center',
  },
  focusedField: {
    borderColor: 'rgba(17, 152, 18, 1)',
    borderWidth: 1,
  },
  pickerContainer: {
    backgroundColor: 'rgb(231,247,233)',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgb(215,233,217)',
    marginTop: 5,
    width: 310,
    height: 35,
    justifyContent: 'center',
  },
  picker: {
    height: 35,
    width: 310,
  },
});

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
