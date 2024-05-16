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
import RecordView from './CollectionRecords';

export default function TaskView({ open, setViewTrack, setTaskToTrack, page }) {
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
    const [userType, setUserType] = useState('');

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
    const [openView, setOpenView] = useState(false);

    let showViewBtn = false, visibility;

    useEffect(() => {
        const getID = async() => {
            const temp = await AsyncStorage.getItem('userId');
            setUserID(temp);

            const temp2 = await AsyncStorage.getItem('userMunicipality');
            setUserMun(temp2);

            const temp3 = await AsyncStorage.getItem('userLguCode');
            setUserLguCode(temp3);

            const temp4 = await AsyncStorage.getItem('userType');
            setUserType(temp4);
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

    const taskToTrack = async() => {
        allActiveTask.map((task) => {
            if(selectedAssign.id === task.taskId || selectedCol.id === task.taskId || selectedRep.id === task.taskId) {
                setTaskToTrack({
                    shiftId: task.shiftId,
                    taskId: task.taskId,
                    taskType: task.taskType
                });
            }
        })
    }

    const changeVisibility = async(visibility, id) => {
        const collectDoc = doc(db, 'schedule', id);
        await updateDoc(collectDoc, {
            visibility: visibility
        });
    }

    const delayNotif = async(id) => {
        const title = 'COLLECTION HAS BEEN DELAYED!';
        let body = 'Scheduled Collection has been delayed for the route:\n';
        allSched.map((sched) => {
            if(sched.id === id) {
                sched.collectionRoute.coordinates.map((coord) => {
                    body = body + '\t- ' +coord.locationName + '\n';
                })
            }
        });
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
        PushNotif(title, body, fullDateTime);
    }

    const activateViewBtn = async() => {
        allActiveTask.map((task) => {
            if(selectedAssign.id === task.taskId || selectedCol.id === task.taskId || selectedRep.id === task.taskId) {
                showViewBtn = true;
            }
        })
    }

    const viewVisibility = async() => {
        allSched.map((sched) => {
            if(sched.id === selectedCol.id && sched.visibility === 'enable') {
                visibility = 'disable';
            } else if(sched.id === selectedCol.id && sched.visibility === 'disable') {
                visibility = 'enable';
            }
        })
    }

    return(activateViewBtn(), viewVisibility(), (
        <>
            {!openView ?
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
                                                            let currentlyActive = false, plateNo, driver, members = [];
                                                            allActiveTask.map((task) => {
                                                                if(task.taskId === sched.id) {
                                                                    currentlyActive = true;
                                                                    allShift.map((shift) => {
                                                                        if(task.shiftId === shift.id) {
                                                                            allTruck.map((truck) => {
                                                                                if(shift.truckId === truck.id) {
                                                                                    plateNo = truck.plateNo;
                                                                                    allUsers.map((user) => {
                                                                                        if(truck.driverID === user.id) {
                                                                                            driver = user.firstName + ' ' + user.lastName;
                                                                                        }
                                                                                    })
                                                                                    truck.members.collector.map((collector) => {
                                                                                        allUsers.map((user) => {
                                                                                            if(collector.id === user.id) {
                                                                                                const name = user.firstName + ' ' + user.lastName;
                                                                                                members.push(name);
                                                                                            }
                                                                                        })
                                                                                    })
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                            if(sched.userID === user.id && (userType === 'LGU / Waste Management Head' ? user.lguCode === userLguCode : user.municipality === userMun) && sched.type === 'Collection') {
                                                                return(
                                                                    <TouchableOpacity activeOpacity={0.7} key={sched.id} onPress={() => {selectedCol.id !== sched.id ? selectTask(sched, 'Collection') : selectTask([], 'Collection')}}>
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
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                            <Text style={{fontSize: 13}}>Visibility</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2, backgroundColor: '#FFDC95', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            <Text style={{fontSize: 13}}>{sched.visibility}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flexDirection: 'row', flex: 1, marginTop: 15, paddingHorizontal: '20%'}}>
                                                                                        <TouchableOpacity activeOpacity={0.7} onPress={() => {setOpenView(true)}} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#49B28E', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                                            <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>View Records</Text>
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                                </View>
                                                                            }
                                                                            {(viewInfo === sched.id && currentlyActive) && 
                                                                                <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                                        <Text style={{fontSize: 13, fontWeight: 800, color: '#49B28E', letterSpacing: 1}}>ACTIVE TRUCK</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                            <Text style={{fontSize: 13}}>Plate No</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            <Text style={{fontSize: 13}}>{plateNo}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                            <Text style={{fontSize: 13}}>Driver</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            <Text style={{fontSize: 13}}>{driver}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                            <Text style={{fontSize: 13}}>Collectors</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            {members.map((member) => {
                                                                                                return (
                                                                                                    <Text key={member} style={{fontSize: 13}}>{member}</Text>
                                                                                                );
                                                                                            })}
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
                                        {filter === 'Assignments' &&
                                            <>
                                                {allSched.map((sched) => {
                                                    return(
                                                        allUsers.map((user) => {
                                                            let currentlyActive = false, plateNo, driver, members = [];
                                                            allActiveTask.map((task) => {
                                                                if(task.taskId === sched.id) {
                                                                    currentlyActive = true;
                                                                    allShift.map((shift) => {
                                                                        if(task.shiftId === shift.id) {
                                                                            allTruck.map((truck) => {
                                                                                if(shift.truckId === truck.id) {
                                                                                    plateNo = truck.plateNo;
                                                                                    allUsers.map((user) => {
                                                                                        if(truck.driverID === user.id) {
                                                                                            driver = user.firstName + ' ' + user.lastName;
                                                                                        }
                                                                                    })
                                                                                    truck.members.collector.map((collector) => {
                                                                                        allUsers.map((user) => {
                                                                                            if(collector.id === user.id) {
                                                                                                const name = user.firstName + ' ' + user.lastName;
                                                                                                members.push(name);
                                                                                            }
                                                                                        })
                                                                                    })
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                            if(sched.userID === user.id && (userType === 'LGU / Waste Management Head' ? user.lguCode === userLguCode : user.municipality === userMun) && sched.type === 'Assignment') {
                                                                return(
                                                                    <TouchableOpacity activeOpacity={0.7} key={sched.id} onPress={() => {selectedAssign.id !== sched.id ? selectTask(sched, 'Assignment') : selectTask([], 'Assignment')}}>
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
                                                                            {(viewInfo === sched.id && currentlyActive) && 
                                                                                <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                                        <Text style={{fontSize: 13, fontWeight: 800, color: '#49B28E', letterSpacing: 1}}>ACTIVE TRUCK</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                            <Text style={{fontSize: 13}}>Plate No</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            <Text style={{fontSize: 13}}>{plateNo}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                            <Text style={{fontSize: 13}}>Driver</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            <Text style={{fontSize: 13}}>{driver}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                        <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                            <Text style={{fontSize: 13}}>Collectors</Text>
                                                                                        </View>
                                                                                        <View style={{display: 'flex', flex: 2.5, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                            {members.map((member) => {
                                                                                                return (
                                                                                                    <Text key={member} style={{fontSize: 13}}>{member}</Text>
                                                                                                );
                                                                                            })}
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
                                                    if(report.municipality === userMun || (page === 'Resident' && report.userId === userID)) {
                                                        try {
                                                            const uri = images.find((link) => link.includes(report.associatedImage));
                                                            imageURI = uri;
                                                        } catch(e) {}
                                                        let currentlyActive = false, plateNo, driver, members = [];
                                                        allActiveTask.map((task) => {
                                                            if(task.taskId === report.id) {
                                                                currentlyActive = true;
                                                                allShift.map((shift) => {
                                                                    if(task.shiftId === shift.id) {
                                                                        allTruck.map((truck) => {
                                                                            if(shift.truckId === truck.id) {
                                                                                plateNo = truck.plateNo;
                                                                                allUsers.map((user) => {
                                                                                    if(truck.driverID === user.id) {
                                                                                        driver = user.firstName + ' ' + user.lastName;
                                                                                    }
                                                                                })
                                                                                truck.members.collector.map((collector) => {
                                                                                    allUsers.map((user) => {
                                                                                        if(collector.id === user.id) {
                                                                                            const name = user.firstName + ' ' + user.lastName;
                                                                                            members.push(name);
                                                                                        }
                                                                                    })
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        })
                                                        return(
                                                            <TouchableOpacity activeOpacity={0.7} key={report.id} onPress={() => {selectedRep.id !== report.id ? selectTask(report, 'Report') : selectTask([], 'Report')}}>
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
                                                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                    <Text style={{fontSize: 13}}>Status</Text>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 3, backgroundColor: '#FFDC95', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                    <Text style={{fontSize: 13}}>{report.status}</Text>
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                    }
                                                                    {(viewInfo === report.id && currentlyActive) && 
                                                                        <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                            <View style={{display: 'flex', flex: 1, alignItems: 'center'}}>
                                                                                <Text style={{fontSize: 13, fontWeight: 800, color: '#49B28E', letterSpacing: 1}}>ACTIVE TRUCK</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                    <Text style={{fontSize: 13}}>Plate No</Text>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 3, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                    <Text style={{fontSize: 13}}>{plateNo}</Text>
                                                                                </View>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end'}}>
                                                                                    <Text style={{fontSize: 13}}>Driver</Text>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 3, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                    <Text style={{fontSize: 13}}>{driver}</Text>
                                                                                </View>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1.2, alignItems: 'flex-end', marginTop: 5}}>
                                                                                    <Text style={{fontSize: 13}}>Collectors</Text>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 3, backgroundColor: '#B8FEE6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                    {members.map((member) => {
                                                                                        return (
                                                                                            <Text key={member} style={{fontSize: 13}}>{member}</Text>
                                                                                        );
                                                                                    })}
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
                            <View style={{display: 'flex', flex: 0.6, marginTop: 10, justifyContent: 'center', alignItems: 'center'}}>
                                {((userType === 'Residents / General Users') || (userType === 'LGU / Waste Management Head' && selectedTaskType !== 'Collection')) &&
                                    <>
                                        {((selectedCol.id !== undefined || selectedAssign.id !== undefined || selectedRep.id !== undefined) && showViewBtn) &&
                                            <TouchableOpacity onPress={() => {setViewTrack(true); taskToTrack(); open(false)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgba(126,185,73,1)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>VIEW</Text>
                                            </TouchableOpacity>
                                        }
                                    </>
                                }
                                {(userType === 'LGU / Waste Management Head' && selectedTaskType === 'Collection') &&
                                    <>
                                        {showViewBtn ?
                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5}}>
                                                {(selectedCol.id !== undefined || selectedAssign.id !== undefined || selectedRep.id !== undefined) &&
                                                    <TouchableOpacity onPress={() => {setViewTrack(true); taskToTrack(); open(false)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgba(126,185,73,1)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                        <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>VIEW</Text>
                                                    </TouchableOpacity>
                                                }
                                                {(selectedCol.id !== undefined || selectedAssign.id !== undefined || selectedRep.id !== undefined) &&
                                                    <TouchableOpacity onPress={() => {delayNotif(selectedCol.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'orange', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                        <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>DELAY</Text>
                                                    </TouchableOpacity>
                                                }
                                            </View>
                                            :
                                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5}}>
                                                {(selectedCol.id !== undefined || selectedAssign.id !== undefined || selectedRep.id !== undefined) &&
                                                    <TouchableOpacity onPress={() => {changeVisibility(visibility, selectedCol.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: visibility === 'disable' ? '#DE462A' : '#49B28E', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                        <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>{visibility.toUpperCase()}</Text>
                                                    </TouchableOpacity>
                                                }
                                                {(selectedCol.id !== undefined || selectedAssign.id !== undefined || selectedRep.id !== undefined) &&
                                                    <TouchableOpacity onPress={() => {delayNotif(selectedCol.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'orange', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                        <Text style={{color: 'white', fontWeight: 900, fontSize: 13}}>DELAY</Text>
                                                    </TouchableOpacity>
                                                }
                                            </View>
                                        }
                                    </>
                                }
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {open(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                    </View>
                </Modal>
                :
                <RecordView open={setOpenView} schedId={viewInfo} allSched={allSched} />
            }
            
        </>
    ));
}