import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, navigate, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { SelectList } from 'react-native-dropdown-select-list';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db } from '../../../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';


export default function AddSched({navigation}) {

    const schedCollection = collection(db, "schedule");

    const [year, setYear] = useState();
    const [month, setMonth] = useState();
    const [day, setDay] = useState();
    const [hourStart, setHourStart] = useState();
    const [minStart, setMinStart] = useState();
    const [ampmStart, setAmpmStart] = useState();
    const [selectType, setSelectType] = useState();
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [title, setTitle] = useState("");
    const [assignLocation, setAssignLocation] = useState("");
    const [assignCollector, setAssignCollector]= useState("")
    const [selectedDate, setSelectedDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});

    const Type = [
        { key: "Collection", value: "Collection" },
        { key: "Assignment", value: "Assignment" },
        { key: "Event", value: "Event" },
    ];

    const Month = [
        { key: "January", value: "January" },
        { key: "February", value: "February" },
        { key: "March", value: "March" },
        { key: "April", value: "April" },
        { key: "May", value: "May" },
        { key: "June", value: "June" },
        { key: "July", value: "July" },
        { key: "August", value: "August" },
        { key: "September", value: "September" },
        { key: "October", value: "October" },
        { key: "November", value: "November" },
        { key: "December", value: "December" },
    ];

    const Year = [];
    let ctr = 0;
    for (let i = 2000; i <= 2090; i++) {
        Year[ctr] = { key: i, value: i };
        ctr++;
    }

    const Day = [];
    let ctr4 = 0;
    if (month === 'January' || month === 'March' || month === 'May' || month === 'July' || month === 'August' || month === 'October' || month === 'December') {
        for (let i = 1; i <= 31; i++) {
            Day[ctr4] = { key: i, value: i };
            ctr4++;
        }
    }
    if (month === 'April' || month === 'June' || month === 'September' || month === 'November') {
        for (let i = 1; i <= 30; i++) {
            Day[ctr4] = { key: i, value: i };
            ctr4++;
        }
    }
    if (month === 'February' && (Number(year) % 4 === 0)) {
        for (let i = 1; i <= 29; i++) {
            Day[ctr4] = { key: i, value: i };
            ctr4++;
        }
    }
    if (month === 'February' && (Number(year) % 4 != 0)) {
        for (let i = 1; i <= 28; i++) {
            Day[ctr4] = { key: i, value: i };
            ctr4++;
        }
    }

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
        let id = await AsyncStorage.getItem('userId');
        // Generate a unique scheduleID
        const scheduleID = Math.random().toString(36).substring(2, 10);
        // Validate necessary values
        if (
          (location !== "" || assignLocation !== "") && setAssignCollector !== "" && description !== "" && selectedDate
        ) {
          await addDoc(schedCollection, {
            scheduleID: scheduleID, 
            type: selectType,
            description: description,
            location: location,
            startTime: start,
            title: newTitle,
            userID: id,
            assignLocation: assignLocation,
            assignCollector: assignCollector,
            selectedDate: selectedDate,
          });
          alert("Schedule successfully added!");
          setMarkedDates((prevMarkedDates) => ({
            ...prevMarkedDates,
            [selectedDate]: { selected: true, selectedColor: getTypeColor(selectType) },
          }));
            setSelectType(null);
            setDescription("");
            setLocation("");
            setTitle("");
            setAssignLocation("");
            setAssignCollector("");
            setSelectedDate(null);
            setHourStart(null);
            setMinStart(null);
            setAmpmStart(null);
            navigation.navigate('mainSched'); //CANT NAVIGATE
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
                <View style={{width: '100%', paddingHorizontal: 25, marginTop: 5}}>
                    <TextInput
                        value ={location}
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
                        onChangeText={(e)=>{setLocation(e)}}
                    />
                </View>
                {SelectDateTime()}
            </>
        );
    }

    function Assignment() {
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
                <View style={{width: '100%', paddingHorizontal: 25, marginTop: 5}}>
                    <TextInput
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
                        placeholder='Select Collector to Assign'
                        onChangeText={(e) => {
                            setAssignCollector(e);
                        }}
                    />
                </View>
                <View style={{width: '100%', paddingHorizontal: 25, marginTop: 5}}>
                    <TextInput
                        value ={assignLocation}
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
                        placeholder='Select Assignment Location'
                        onChangeText={(e)=>{setAssignLocation(e)}}
                    />
                </View>
                {SelectDateTime()}
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
                        onChangeText={(e)=>{setLocation(e)}}
                    />
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
                <View style={{ position: "absolute", width: "100%", alignItems: "flex-start", top: 30, left: 20, zIndex: 10, }}>
                    <TouchableOpacity onPress={() => { navigation.navigate('mainSched'); }}>
                        <Ionicons name="arrow-back" style={{ fontSize: 40, color: "rgb(179,229,94)" }} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}>
                    <ScrollView style={{ width: "100%" }} contentContainerStyle={{ alignItems: 'flex-start', paddingTop: 90, }}>
                        <Text style={{marginBottom: 5, fontSize: 25, fontWeight: 900, color: 'rgba(113, 112, 108, 1)', width: '100%', paddingLeft: 25}}>CREATE TASK</Text>
                        <View style={{marginLeft: 25, marginBottom: 10}}>
                            <SelectList
                                setSelected={(e) => { setSelectType(e); }}
                                data={Type}
                                placeholder="Select Type"
                                boxStyles={{
                                    width: 310,
                                    backgroundColor: "rgb(189,228,124)",
                                    borderRadius: 10,
                                    color: "rgba(45, 105, 35, 1)",
                                    justifyContent: "center",
                                    borderWidth: 0,
                                }}
                                dropdownStyles={{
                                    width: 310,
                                    backgroundColor: "rgb(231,247,233)",
                                    top: -10,
                                    marginBottom: -10,
                                    borderRadius: 10,
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
        verticalAlign: 'middle',
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
    },
})