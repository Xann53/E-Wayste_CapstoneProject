import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { returnKeyType } from 'deprecated-react-native-prop-types/DeprecatedTextInputPropTypes';

import PushNotif from './PushNotification';

export default function TaskPanel({ open, trackRoute, setShowColMarker, quickRoute, setShowDirection, setShowFlag, setShowAssignPin, setAssignPinLoc }) {
    const userRef = firebase.firestore().collection("users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const schedRef = firebase.firestore().collection("schedule");
    const sihftRef = firebase.firestore().collection("collectorShift");
    const truckRef = firebase.firestore().collection("trucks");
    const activeRef = firebase.firestore().collection("activeTask");
    const activeRouteRef = firebase.firestore().collection("routeForActiveCollection");
    const postImagesRef = ref(storage, "postImages/");
    const addActiveTaskRef = collection(db, "activeTask");
    const addRouteForColRef = collection(db, "routeForActiveCollection");

    const [userID, setUserID] = useState('');
    const [userMun, setUserMun] = useState('');
    const [userLguCode, setUserLguCode] = useState('');
    
    const [allUsers, setAllUsers] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [allSched, setAllSched] = useState([]);
    const [allShift, setAllShift] = useState([]);
    const [allTruck, setAllTruck] = useState([]);
    const [allActiveTask, setAllActiveTask] = useState([]);
    const [allActiveRoute, setAllActiveRoute] = useState([]);
    const [images, setImages] = useState([]);

    const [filter, setFilter] = useState('Reports');
    const [viewInfo, setViewInfo] = useState('');
    const [selectedTaskType, setSelectedTaskType] = useState('');
    const [selectedCol, setSelectedCol] = useState({});
    const [selectedAssign, setSelectedAssign] = useState({});
    const [selectedRep, setSelectedRep] = useState({});

    let isDriver = false, isActive = false, isActiveId = '';

    useEffect(() => {
        const getID = async() => {
            const temp = await AsyncStorage.getItem('userId');
            setUserID(temp);

            const temp2 = await AsyncStorage.getItem('userMunicipality');
            setUserMun(temp2);

            const temp3 = await AsyncStorage.getItem('userLguCode');
            setUserLguCode(temp3);
        }
        getID();
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllUsers(newData);
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
            setAllReports(newData);
        };
        const unsubscribe = reportRef.onSnapshot(onSnapshot);
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
        const unsubscribe = schedRef.onSnapshot(onSnapshot);
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
            setAllTruck(newData);
        };
        const unsubscribe = truckRef.onSnapshot(onSnapshot);
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
            setAllActiveTask(newData);
        };
        const unsubscribe = activeRef.onSnapshot(onSnapshot);
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
        listAll(postImagesRef).then((response) => {
            setImages([]);
            response.items.forEach((item) => {
                getDownloadURL(item).then((url) => {
                    setImages((prev) => [...prev, url])
                })
            })
        })
    }, []);

    const selectTask = async(data, type) => {
        setSelectedTaskType('');
        setSelectedCol({});
        setSelectedAssign({});
        setSelectedRep({});
        if(type === 'Collection') {
            setSelectedCol(data);
            setSelectedTaskType('Collection');
        } else if(type === 'Assignment') {
            setSelectedAssign(data);
            setSelectedTaskType('Assignment');
        } else if(type === 'Report') {
            setSelectedRep(data);
            setSelectedTaskType('Report');
        }
    }

    const activateTask = async(collectionData) => {
        let taskId, shiftId, trackId;
        if(selectedTaskType === 'Collection') {
            taskId = selectedCol.id;
            const title = 'GARBAGE COLLECTION DAY!';
            const body = 'Scheduled Collection has started';
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
            PushNotif(title, body, fullDateTime);
        } else if(selectedTaskType === 'Assignment') {
            taskId = selectedAssign.id;
        } else if(selectedTaskType === 'Report') {
            taskId = selectedRep.id;
        }
        allShift.map((shift) => {
            if(shift.driverId === userID) {
                shiftId = shift.id;
                trackId = shift.trackId;
            }
        })
        try {
            const doc = await addDoc(addActiveTaskRef, {
                taskId: taskId,
                taskType: selectedTaskType,
                shiftId: shiftId,
                userId: userID
            });
            setShowColMarker(true);
            trackRoute(trackId);
            setDestination(collectionData, doc.id);
        } catch(e) {}
    }

    const deactivateTask = async(taskId) => {
        let id;
        allActiveTask.map((task) => {
            if(task.taskId === taskId) {
                id = task.id;
            }
        })
        if(selectedTaskType === 'Collection') {
            const title = 'COLLECTION HAS ENDED';
            const body = 'Scheduled Collection has Ended';
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:MM:SS');
            PushNotif(title, body, fullDateTime);

            let record = [];
            allSched.map((sched) => {
                if(sched.id === taskId && sched.type === 'Collection') {
                    sched.collectionRecord.map((dateTime) => {
                        record.push(dateTime);
                    })
                }
            })
            record.push({dateTimeCollected: fullDateTime});

            const collectDoc = doc(db, 'schedule', taskId);
            await updateDoc(collectDoc, {
                collectionRecord: record
            });
        }
        try {
            const docRef = firebase.firestore().collection('activeTask').doc(id);
            await docRef.delete();
            setShowColMarker(false);
            setShowDirection(false);
            deleteColRoute(id);
            setShowAssignPin(false);
        } catch(e) {}
    }

    const setDestination = async(collectionData, activeTaskId) => {
        if(selectedTaskType === 'Collection') {
            uploadColRoute(collectionData, activeTaskId);
        } else if(selectedTaskType === 'Assignment') {
            quickRoute(selectedAssign.latitude, selectedAssign.longitude);
            setAssignPinLoc({latitude: selectedAssign.latitude, longitude: selectedAssign.longitude});
            setShowDirection(true);
            setShowAssignPin(true);
        } else if(selectedTaskType === 'Report') {
            quickRoute(selectedRep.latitude, selectedRep.longitude);
            setShowDirection(true);
        }
    }

    const uploadColRoute = async(collectionData, activeTaskId) => {
        let templocData = [], shiftId;
        collectionData.collectionRoute.coordinates.map((data) => {
            templocData.push(data);
        })
        allShift.map((shift) => {
            if(shift.driverId === userID) {
                shiftId = shift.id;
            }
        })
        try {
            await addDoc(addRouteForColRef, {
                activeTaskId: activeTaskId,
                taskType: 'Collection',
                shiftId: shiftId,
                taskRoute: templocData,
                userId: userID
            })
            setShowFlag(true);
        } catch(e) {}
    }

    const deleteColRoute = async(taskId) => {
        let id;
        allActiveRoute.map((route) => {
            if(route.activeTaskId === taskId) {
                id = route.id;
            }
        })
        try {
            const docRef = firebase.firestore().collection('routeForActiveCollection').doc(id);
            await docRef.delete();
            setShowFlag(false);
        } catch(e) {}
    }
    
    return(
        <>
            <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                <View style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                    <View style={{display: 'flex', backgroundColor: 'white', height: '85%', width: '90%', borderRadius: 15, padding: 10}}>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <View style={{display: 'flex', flex: 1}} />
                            <View style={{display: 'flex', flex: 10, flexDirection: 'row', justifyContent: 'center'}}>
                                <Text style={{fontSize: 16, fontWeight: 900, letterSpacing: 1, color: 'green'}}>TASK LIST</Text>
                            </View>
                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
                                <TouchableOpacity onPress={() => {open(false)}}>
                                    <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                        <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginTop: 15, justifyContent: 'space-evenly', gap: 5, paddingHorizontal: 15}}>
                            <TouchableOpacity onPress={() => {setFilter('Reports')}} activeOpacity={0.7} disabled={filter === 'Reports' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Reports' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                    <Text style={{fontSize: 13}}>Reports</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setFilter('Collections')}} activeOpacity={0.7} disabled={filter === 'Collections' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Collections' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                    <Text style={{fontSize: 13}}>Collections</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setFilter('Assignments')}} activeOpacity={0.7} disabled={filter === 'Assignments' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Assignments' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                    <Text style={{fontSize: 13}}>Assignments</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{display: 'flex', flex: 10, width: '100%', marginTop: 10}}>
                            <ScrollView style={{display: 'flex', flex: 1, width: '100%',  backgroundColor: "rgb(179,229,94)", borderRadius: 10, padding: 10, shadowColor: 'black'}}>
                                <View style={{display: 'flex', flex: 1, width: '100%', gap: 5, marginBottom: 20}}>
                                    {filter === 'Collections' &&
                                        <>
                                            {allSched.map((sched) => {
                                                return(
                                                    allUsers.map((user) => {
                                                        let plateNo;
                                                        allShift.map((shift) => {
                                                            if(shift.driverId === userID) {
                                                                return(allTruck.map((truck) => {
                                                                    if(truck.id === shift.truckId) {
                                                                        plateNo = truck.plateNo;
                                                                    }
                                                                }));
                                                            }
                                                        })
                                                        let currentlyActive = false;
                                                        allActiveTask.map((task) => {
                                                            if(task.taskId === sched.id) {
                                                                currentlyActive = true;
                                                            }
                                                        })
                                                        if(sched.userID === user.id && user.lguCode === userLguCode && sched.type === 'Collection' && sched.assignedTruck === plateNo) {
                                                            return(
                                                                <TouchableOpacity key={sched.id} onPress={() => {selectedCol.id !== sched.id ? selectTask(sched, 'Collection') : selectTask([], 'Collection')}}>
                                                                    <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 5, gap: 15, borderWidth: selectedCol.id === sched.id ? 3 : 0, borderColor: 'orange'}}>
                                                                        <View style={{display: 'flex', flexDirection: 'row'}}>
                                                                            <View style={{display: 'flex', flex: 4, justifyContent: 'center', overflow: 'hidden'}}>
                                                                                <Text numberOfLines={viewInfo !== sched.id ? 1 : 999} style={{fontWeight: 600, fontSize: 14, color: '#B47707'}}>{sched.description}</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 0.5, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                                <TouchableOpacity onPress={() => {viewInfo !== sched.id ? setViewInfo(sched.id) : setViewInfo('')}} style={{paddingLeft: 5}}>
                                                                                    <Ionicons name={viewInfo === sched.id ? "document-text-outline" : "document-text"} style={{fontSize: 25, color: 'orange'}} />
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        </View>
                                                                        {currentlyActive && 
                                                                            <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                                <Text style={{fontSize: 13, fontWeight: 800, color: 'green', letterSpacing: 1}}>CURRENTLY ACTIVE</Text>
                                                                            </View>
                                                                        }
                                                                        {viewInfo === sched.id &&
                                                                            <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Date and Time</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.selectedDate} {sched.startTime}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                {sched.collectionRoute.coordinates.map((coord) => {
                                                                                    return (
                                                                                        <View key={coord.name} style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                            <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                                <Text style={{fontSize: 13}}>Location {parseInt(coord.name) + 1}</Text>
                                                                                            </View>
                                                                                            <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                                <Text style={{fontSize: 13}}>{coord.locationName}</Text>
                                                                                            </View>
                                                                                        </View>
                                                                                    );
                                                                                })}
                                                                            </View>
                                                                        }
                                                                    </View>
                                                                </TouchableOpacity>
                                                            );
                                                        }
                                                    })
                                                );
                                            })}
                                        </>
                                    }
                                    {filter === 'Assignments' &&
                                        <>
                                            {allSched.map((sched) => {
                                                return(
                                                    allUsers.map((user) => {
                                                        let plateNo;
                                                        allShift.map((shift) => {
                                                            if(shift.driverId === userID) {
                                                                return(allTruck.map((truck) => {
                                                                    if(truck.id === shift.truckId) {
                                                                        plateNo = truck.plateNo;
                                                                    }
                                                                }));
                                                            }
                                                        })
                                                        let currentlyActive = false;
                                                        allActiveTask.map((task) => {
                                                            if(task.taskId === sched.id) {
                                                                currentlyActive = true;
                                                            }
                                                        })
                                                        if(sched.userID === user.id && user.lguCode === userLguCode && sched.type === 'Assignment' && sched.assignedTruck === plateNo) {
                                                            return(
                                                                <TouchableOpacity key={sched.id} onPress={() => {selectedAssign.id !== sched.id ? selectTask(sched, 'Assignment') : selectTask([], 'Assignment')}}>
                                                                    <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 5, gap: 15, borderWidth: selectedAssign.id === sched.id ? 3 : 0, borderColor: 'orange'}}>
                                                                        <View style={{display: 'flex', flexDirection: 'row'}}>
                                                                            <View style={{display: 'flex', flex: 4, justifyContent: 'center', overflow: 'hidden'}}>
                                                                                <Text numberOfLines={viewInfo !== sched.id ? 1 : 999} style={{fontWeight: 600, fontSize: 14, color: '#B47707'}}>{sched.description}</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 0.5, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                                <TouchableOpacity onPress={() => {viewInfo !== sched.id ? setViewInfo(sched.id) : setViewInfo('')}} style={{paddingLeft: 5}}>
                                                                                    <Ionicons name={viewInfo === sched.id ? "document-text-outline" : "document-text"} style={{fontSize: 25, color: 'orange'}} />
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        </View>
                                                                        {currentlyActive && 
                                                                            <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                                <Text style={{fontSize: 13, fontWeight: 800, color: 'green', letterSpacing: 1}}>CURRENTLY ACTIVE</Text>
                                                                            </View>
                                                                        }
                                                                        {viewInfo === sched.id &&
                                                                            <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Date and Time</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.selectedDate} {sched.startTime}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                        <Text style={{fontSize: 13}}>Location</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.location}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Latitude</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.latitude}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Longitude</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.longitude}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Status</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#FFDC95', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.collectionRecord.status}</Text>
                                                                                    </View>
                                                                                </View>
                                                                            </View>
                                                                        }
                                                                    </View>
                                                                </TouchableOpacity>
                                                            );
                                                        }
                                                    })
                                                );
                                            })}
                                        </>
                                    }
                                    {filter === 'Reports' &&
                                        <>
                                            {allReports.map((report) => {
                                                let imageURI;
                                                if(report.municipality === userMun && report.status === 'uncollected') {
                                                    try {
                                                        const uri = images.find((link) => link.includes(report.associatedImage));
                                                        imageURI = uri;
                                                    } catch(e) {}
                                                    let currentlyActive = false;
                                                    allActiveTask.map((task) => {
                                                        if(task.taskId === report.id) {
                                                            currentlyActive = true;
                                                        }
                                                    })
                                                    return(
                                                        <TouchableOpacity key={report.id} onPress={() => {selectedRep.id !== report.id ? selectTask(report, 'Report') : selectTask([], 'Report')}}>
                                                            <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 5, gap: 15, borderWidth: selectedRep.id === report.id ? 3 : 0, borderColor: 'orange'}}>
                                                                <View style={{display: 'flex', flexDirection: 'row'}}>
                                                                    <View style={{display: 'flex', flex: 1, height: 200, justifyContent: 'center', overflow: 'hidden', borderRadius: 10}}>
                                                                        {imageURI && <Image source={{ uri: imageURI }} style={{ display: 'flex', flex: 1, width: '100%', resizeMode: 'cover', zIndex: 40 }} />}
                                                                    </View>
                                                                    <View style={{position: 'absolute', right: 0, alignItems: 'flex-end', overflow: 'hidden', paddingLeft: 5, paddingBottom: 5, backgroundColor: 'white', borderBottomLeftRadius: 10}}>
                                                                        <TouchableOpacity onPress={() => {viewInfo !== report.id ? setViewInfo(report.id) : setViewInfo('')}}>
                                                                            <Ionicons name={viewInfo === report.id ? "document-text-outline" : "document-text"} style={{fontSize: 25, color: 'orange'}} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                                {currentlyActive && 
                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                        <Text style={{fontSize: 13, fontWeight: 800, color: 'green', letterSpacing: 1}}>CURRENTLY ACTIVE</Text>
                                                                    </View>
                                                                }
                                                                {viewInfo === report.id &&
                                                                    <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                        <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                            <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                <Text style={{fontSize: 13}}>Location</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 3, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                <Text style={{fontSize: 13}}>{report.location}</Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                            <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                <Text style={{fontSize: 13}}>Latitude</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 3, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                <Text style={{fontSize: 13}}>{report.latitude}</Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                            <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                <Text style={{fontSize: 13}}>Longitude</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 3, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                <Text style={{fontSize: 13}}>{report.longitude}</Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                }
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                }
                                            })}
                                        </>
                                    }
                                </View>
                            </ScrollView>
                        </View>
                        {allShift.map((shift) => {
                            if(shift.driverId === userID) {
                                isDriver = true;
                                allActiveTask.map((active) => {
                                    if(shift.id === active.shiftId) {
                                        isActive = true;
                                        isActiveId = active.taskId;
                                    }
                                })
                            }
                        })}
                        <View style={{display: 'flex', flex: 0.6, marginTop: 10, justifyContent: 'center', alignItems: 'center'}}>
                            {isDriver &&
                                <>
                                    {(selectedCol.id === isActiveId || selectedAssign.id === isActiveId || selectedRep.id === isActiveId) ? 
                                        <TouchableOpacity onPress={() => {deactivateTask(isActiveId)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#DE462A', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                            <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>END TRACK</Text>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity disabled={((selectedCol.id === undefined && selectedAssign.id === undefined && selectedRep.id === undefined) || isActive) ? true : false} onPress={() => {activateTask(selectedCol)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgba(126,185,73,1)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                            {((selectedCol.id === undefined && selectedAssign.id === undefined && selectedRep.id === undefined) || isActive) && <View style={{position: 'absolute', height: '200%', width: '200%', backgroundColor: '#C9C9C9', opacity: 0.4, zIndex: 5}} />}
                                            <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>TRACK</Text>
                                        </TouchableOpacity>
                                    }
                                </>
                            }
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => {open(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                </View>
            </Modal>
        </>
    );
}