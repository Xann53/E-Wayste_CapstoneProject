import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import TruckInfo from "./ViewTruckInfo";

export default function MTruckList({ open, collectorLocation, collectorLoc, users }) {
    const truckRef = firebase.firestore().collection("trucks");
    const shiftRef = firebase.firestore().collection("collectorShift");
    const requestPullRef = firebase.firestore().collection("ShiftAttendanceRequest");
    const colShiftRef = collection(db, "collectorShift");
    const requestRef = collection(db, "ShiftAttendanceRequest");
    const colShiftRecordRef = collection(db, "collectorShiftRecord");
    
    const [dataList, setDataList] = useState([]);
    const [truckID, setTruckID] = useState();
    const [openInfo, setOpenInfo] = useState(false);
    const [userIDState, setUserIDState] = useState('');
    const [filter, setFilter] = useState('All');
    const [allData, setAllData] = useState([]);
    const [shiftData, setShiftData] = useState([]);
    const [allRequest, setAllRequest] = useState([]);
    const [openAttendance, setOpenAttendance] = useState(false);

    let userID, joined = false, joined2 = false, isActiveByOther = false;

    const [selected, setSelected] = useState([]);
    const [activeByUser, setActiveByUser] = useState([]);
    const [activeByOther, setActiveByOther] = useState([]);
    const [pending, setPending] = useState([]);

// =====================================================================================================================================================================================================================

    useEffect(() => {
        const getID = async() => {
            const temp = await AsyncStorage.getItem('userId');
            userID = temp;
            setUserIDState(temp);
        }
        getID();
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setShiftData(newData);

        };

        const unsubscribe = shiftRef.onSnapshot(onSnapshot);

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

            setAllRequest(newData);

        };

        const unsubscribe = requestPullRef.onSnapshot(onSnapshot);

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

            let tempData = [];
            let ctr = 0, tempNum = [];
            newData.map((data) => {
                if(data.driverID === userID) {
                    const temp = newData.filter((truck) => data.id === truck.id);
                    tempData.push(temp[0]);
                }
                data.members.collector.map((col) => {
                    if(col.id === userID) {
                        tempNum.push(ctr);
                    }
                })
                ctr++;
            })
            tempNum.map((num) => {
                tempData.push(newData[num]);
            })

            setDataList(tempData);
            setAllData(newData);

        };

        const unsubscribe = truckRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, [])

// =====================================================================================================================================================================================================================

    const closeInfo = async() => {
        setOpenInfo(false);
    }

    const changeFilter = async(choice) => {
        let tempData = [];
        let ctr = 0, tempNum = [];
        allData.map((data) => {
            if((data.driverID === userIDState) && (choice === 'All' || choice === 'Driver')) {
                const temp = allData.filter((truck) => data.id === truck.id);
                tempData.push(temp[0]);
            }
            data.members.collector.map((col) => {
                if(col.id === userIDState) {
                    tempNum.push(ctr);
                }
            })
            ctr++;
        })
        if(choice === 'All' || choice === 'Collector') {
            tempNum.map((num) => {
                tempData.push(allData[num]);
            })
        }

        setDataList(tempData);
    }

    const loadCurrentShift = async() => {
        let proceed = false, truckTempId1, truckTempId2 = [];
        shiftData.map((shift) => {
            if(shift.driverId === userIDState) {
                proceed = true;
                truckTempId1 = shift.truckId;
            }
            shift.attendees.map((attendee) => {
                if(attendee.id === userIDState) {
                    proceed = true;
                    truckTempId2.push(shift.truckId);
                }
            })
        })
        if(proceed) {
            let tempActiveByOther = [];
            dataList.map((truck) => {
                if(truck.id === truckTempId1) {
                    setActiveByUser(truck);
                }
                truckTempId2.map((truckId) => {
                    if(truck.id === truckId) {
                        tempActiveByOther.push(truck);
                    }
                })
            })
            setActiveByOther(tempActiveByOther);
        }

        setPending([]);
        allRequest.map((request) => {
            if(request.userId === userIDState) {
                setPending(request);
            }
        })
    }

// =====================================================================================================================================================================================================================

    const createLocData = async(truckID) => {
        try {
            const temp = collectorLocation.map((colLocation) => {
                if(colLocation.truckId === truckID) {
                    return true;
                }
            })
            const targetVal = true;
            const temp2 = temp.includes(targetVal);

            if(!temp2) {
                const docRef = await addDoc(collectorLoc, {
                    truckId: truckID,
                    latitude: '',
                    longitude: '',
                });
                const trackID = docRef.id;
                startShift(truckID, trackID);
            }
        } catch(e) {
            console.log(e);
        }
    }

    const deleteLocData = async(truckID) => {
        let id
        collectorLocation.map((temp) => {
            if(temp.truckId.includes(truckID)) {
                id = temp.id;
            }
        })

        try {
            const docRef = firebase.firestore().collection('collectorLocationTrack').doc(id);
            await docRef.delete();
            endShift(truckID);
        } catch(e) {
            console.log(e);
        }
    }

// =====================================================================================================================================================================================================================

    const startShift = async(truckID, trackID) => {
        const lguCode = await AsyncStorage.getItem('userLguCode');
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:MM:SS');

        let tempData1 = [], tempData2 = [];
        dataList.map((temp) => {
            if(temp.id === truckID) {
                tempData1.push(temp);
            }
        })
        tempData1[0].members.collector.map((temp) => {
            tempData2.push({
                id: temp.id,
                status: 'Not Present'
            });
        })

        try {
            await addDoc(colShiftRef, {
                truckId: truckID,
                trackId: trackID,
                driverId: userIDState,
                lguCode: lguCode,
                shiftStartDateTime: fullDateTime,
                attendees: tempData2
            });
        } catch(e) {
            console.log(e);
        }
    }

    const joinShift = async(truckID) => {
        setPending([]);
        let shiftId;
        shiftData.map((shift) => {
            if(shift.truckId === truckID) {
                shiftId = shift.id;
            }
        })
        try {
            const docRef = await addDoc(requestRef, {
                shiftId: shiftId,
                userId: userIDState,
                truckId: truckID
            });
            const tempId = docRef.id;
            setPending({
                id: tempId,
                shiftId: shiftId,
                userId: userIDState,
                truckId: truckID
            });
        } catch(e) {
            console.log(e);
        }
    }

    const endShift = async(truckID) => {
        let id;
        shiftData.map((temp) => {
            if(temp.truckId.includes(truckID)) {
                id = temp.id;
            }
        })

        shiftData.map(async(shift) => {
            if(shift.id === id) {
                await addDoc(colShiftRecordRef, {
                    attendees: shift.attendees,
                    driverId: shift.driverId,
                    lguCode: shift.lguCode,
                    shiftStartDateTime: shift.shiftStartDateTime,
                    truckId: shift.truckId
                })
            }
        })

        try {
            const docRef = firebase.firestore().collection('collectorShift').doc(id);
            await docRef.delete();
        } catch(e) {
            console.log(e);
        }

        let id2 = [];
        allRequest.map((pending) => {
            if(pending.truckId === truckID) {
                id2.push(pending.id);
            }
        })
        id2.map(async(id) => {
            try {
                const docRef = firebase.firestore().collection('ShiftAttendanceRequest').doc(id);
                await docRef.delete();
            } catch(e) {}
        })
    }

    const updateAttendance = async(members, id, shiftId) => {
        let attendees = [];
        members.map((member) => {
            attendees.push({
                id: member.id,
                status: member.status
            });
        })
        attendees.map((attendee) => {
            if(attendee.id === id) {
                attendee.status = 'Present';
            }
        })
        const shiftDoc = doc(db, "collectorShift", shiftId);
        const newFields = {
            attendees: attendees
        };
        await updateDoc(shiftDoc, newFields);
        members.map((member) => {
            if(member.id === id) {
                member.status = 'Present';
            }
        })
    }

    const deleteRequest = async(requestId) => {
        try {
            const docRef = firebase.firestore().collection('ShiftAttendanceRequest').doc(requestId);
            await docRef.delete();
        } catch(e) {}
    }

    const departShift = async(truckId) => {
        try {
            let attendees = [], shiftId;
            shiftData.map((shift) => {
                if(shift.truckId === truckId) {
                    shiftId = shift.id;
                    shift.attendees.map((member) => {
                        attendees.push({
                            id: member.id,
                            status: member.status
                        });
                    })
                }
            });
            attendees.map((attendee) => {
                if(attendee.id === userIDState) {
                    attendee.status = 'Not Present';
                }
            })
            const shiftDoc = doc(db, "collectorShift", shiftId);
            const newFields = {
                attendees: attendees
            };
            await updateDoc(shiftDoc, newFields);

            shiftData.map((shift) => {
                if(shift.truckId === truckId) {
                    shiftId = shift.id;
                    shift.attendees.map((member) => {
                        if(member.id === userIDState) {
                            member.status = 'Not Present';
                        }
                    })
                }
            });
        } catch(e) {}
    }

    const departPending = async(truckId) => {
        try {
            let requestId;
            allRequest.map((request) => {
                if(request.truckId === truckId && request.userId === userIDState) {
                    requestId = request.id;
                }
            })
            const docRef = firebase.firestore().collection('ShiftAttendanceRequest').doc(requestId);
            await docRef.delete();

            setPending([]);
        } catch(e) {}
    }

// =====================================================================================================================================================================================================================

    return (
        <>
            {(!openInfo) ?
                <>
                    <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                            <View style={{display: 'flex', flex: 1, backgroundColor: 'white', height: selected.id === undefined ? '40%' : '47%', borderRadius: 15, padding: 10, marginHorizontal: 50}}>
                                <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                                    <View style={{display: 'flex', flex: 1}} />
                                    <View style={{display: 'flex', flex: 10, flexDirection: 'row', justifyContent: 'center'}}>
                                        <Text style={{fontSize: 18, fontWeight: 900, letterSpacing: 1, color: 'green'}}>{!openAttendance ? 'SHIFT MANAGEMENT' : 'ATTENDANCE'}</Text>
                                    </View>
                                    <View style={{display: 'flex', flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
                                        <TouchableOpacity onPress={() => {open(false)}}>
                                            <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                                <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {!openAttendance &&
                                    <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginTop: 15, justifyContent: 'space-evenly', gap: 5, paddingHorizontal: 15}}>
                                        <TouchableOpacity onPress={() => {setFilter('All'); changeFilter('All')}} activeOpacity={0.7} disabled={filter === 'All' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'All' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                                <Text>All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {setFilter('Driver'); changeFilter('Driver')}} activeOpacity={0.7} disabled={filter === 'Driver' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Driver' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                                <Text>Driver</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => {setFilter('Collector'); changeFilter('Collector')}} activeOpacity={0.7} disabled={filter === 'Collector' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Collector' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                                <Text>Collector</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                                <View style={{display: 'flex', flex: 5, width: '100%', marginTop: 10}}>
                                    <ScrollView style={{display: 'flex', flex: 1, width: '100%',  backgroundColor: "rgb(179,229,94)", borderRadius: 10, padding: 10, shadowColor: 'black'}}>
                                        <View style={{display: 'flex', flex: 1, width: '100%', gap: 5}}>
                                            {!openAttendance ?
                                                <>
                                                    {dataList.map((truck) => (
                                                        <TouchableOpacity key={truck.id} onPress={() => { selected.id !== truck.id ? setSelected(truck) : setSelected([]); loadCurrentShift()}}>
                                                            <View style={{display: 'flex', flexDirection: 'row', width: '100%', padding: 10, backgroundColor: selected.id === truck.id ? 'rgba(126,185,73,1)' : 'white', borderRadius: 5}}>
                                                                <View style={{display: 'flex', flex: 1.2, justifyContent: 'center', overflow: 'hidden'}}>
                                                                    <Text style={{fontWeight: 800, fontSize: 16, color: selected.id === truck.id ? 'white' : '#B47707'}}>{truck.plateNo}</Text>
                                                                </View>
                                                                <View style={{display: 'flex', flex: 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
                                                                    {selected.id === truck.id &&
                                                                        <Text style={{fontWeight: 800, fontSize: 14, transform: [{translateX: -15}], color: 'rgb(135,255,116)'}}>{userIDState === truck.driverID ? 'DRIVER' : 'COLLECTOR'}</Text>
                                                                    }
                                                                </View>
                                                                <View style={{display: 'flex', flex: 0.5, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                    <TouchableOpacity onPress={() => {setTruckID(truck.id); setOpenInfo(true)}} style={{paddingLeft: 5}}>
                                                                        <Ionicons name="document-text" style={{fontSize: 25, color: selected.id === truck.id ? 'white' : 'orange'}} />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </>
                                                :
                                                <>
                                                    {shiftData.map((shift) => {
                                                        if(shift.truckId === selected.id) {
                                                            return (
                                                                shift.attendees.map((member) => {
                                                                    let name, isPending = false, requestId;
                                                                    users.map((user) => {
                                                                        if(user.id === member.id) {
                                                                            name = user.firstName + ' ' + user.lastName;
                                                                        }
                                                                    })
                                                                    allRequest.map((request) => {
                                                                        if(request.userId === member.id){
                                                                            isPending = true;
                                                                            requestId = request.id;
                                                                        }
                                                                    })
                                                                    return(
                                                                        <View key={member.id} style={{display: 'flex', flexDirection: 'row', width: '100%', padding: 10, backgroundColor: member.status !== 'Present' ? 'white' : 'rgba(126,185,73,1)', borderRadius: 5}}>
                                                                            <View style={{display: 'flex', flex: 1, justifyContent: 'center', overflow: 'hidden'}}>
                                                                                <Text style={{fontWeight: 800, fontSize: 16, color: member.status !== 'Present' ? '#B47707' : 'white'}}>{name}</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 0.6, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                                {member.status !== 'Present' ?
                                                                                    <TouchableOpacity disabled={!isPending ? true : false} onPress={() => {updateAttendance(shift.attendees, member.id, shift.id); deleteRequest(requestId); loadCurrentShift()}} style={{padding: 5, backgroundColor: 'orange', borderRadius: 100, opacity: !isPending ? 0 : 100}}>
                                                                                        <Text style={{color: 'white', fontSize: 12, fontWeight: 900}}>PENDING</Text>
                                                                                    </TouchableOpacity>
                                                                                    :
                                                                                    <View style={{padding: 5, backgroundColor: 'rgba(126,185,73,1)', borderRadius: 100}}>
                                                                                        <Text style={{color: 'rgb(135,255,116)', fontSize: 12, fontWeight: 900}}>PRESENT</Text>
                                                                                    </View>
                                                                                }
                                                                            </View>
                                                                        </View>
                                                                    );
                                                                })
                                                            );
                                                        }
                                                    })}
                                                </>
                                            }
                                        </View>
                                    </ScrollView>
                                </View>
                                {!openAttendance ?
                                    <>
                                        {selected.id !== undefined &&
                                            <View style={{display: 'flex', flexDirection: 'row', flex: 1}}>
                                                {selected.driverID === userIDState ?
                                                    <>
                                                        {selected.condition === 'inoperational' ?
                                                            <View style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 50, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#C9C9C9', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                <Text style={{color: 'grey', fontWeight: 900}}>OUT OF ORDER</Text>
                                                            </View>
                                                            :
                                                            <>
                                                                {selected.id !== activeByUser.id ?
                                                                    <>
                                                                        {shiftData.map((shift) => {
                                                                            let proceed = false;
                                                                            activeByOther.map((truck) => {
                                                                                if(shift.truckId === truck.id) {
                                                                                    proceed = true;
                                                                                }
                                                                            })
                                                                            if(proceed) {
                                                                                shift.attendees.map((attendee) => {
                                                                                    if(attendee.id === userIDState) {
                                                                                        if(attendee.status === 'Present') {
                                                                                            joined = true;
                                                                                        }
                                                                                    }
                                                                                })
                                                                            }
                                                                        })}
                                                                        <TouchableOpacity disabled={(pending.length !== 0 || joined) ? true : false} onPress={() => {setActiveByUser(selected); createLocData(selected.id); loadCurrentShift()}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 50, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgba(126,185,73,1)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                            {(pending.length !== 0 || joined) && <View style={{position: 'absolute', height: '200%', width: '200%', backgroundColor: '#C9C9C9', opacity: 0.4, zIndex: 5}} />}
                                                                            <Text style={{color: 'white', fontWeight: 900}}>START COLLECTION</Text>
                                                                        </TouchableOpacity>
                                                                    </>
                                                                    :
                                                                    <>
                                                                        <TouchableOpacity onPress={() => {setActiveByUser([]); deleteLocData(selected.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 5, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#DE462A', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                            <Text style={{color: 'white', fontWeight: 900, fontSize: 12}}>END COLLECTION</Text>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity onPress={() => {setOpenAttendance(true)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 5, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'orange', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                            <Text style={{color: 'white', fontWeight: 900, fontSize: 12}}>VIEW ATTENDEES</Text>
                                                                        </TouchableOpacity>
                                                                    </>
                                                                }
                                                            </>
                                                        }
                                                    </>
                                                    :
                                                    <>
                                                        {shiftData.map((shift) => {
                                                            if(shift.truckId === selected.id) {
                                                                shift.attendees.map((attendee) => {
                                                                    if(attendee.id === userIDState) {
                                                                        if(attendee.status === 'Present') {
                                                                            joined = true;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                        })}
                                                        {activeByOther.map((truck) => {
                                                            if(selected.id === truck.id) {
                                                                isActiveByOther = true;
                                                            }
                                                        })}
                                                        {shiftData.map((shift) => {
                                                            let proceed = false;
                                                            activeByOther.map((truck) => {
                                                                if(shift.truckId === truck.id) {
                                                                    proceed = true;
                                                                }
                                                            })
                                                            if(proceed) {
                                                                shift.attendees.map((attendee) => {
                                                                    if(attendee.id === userIDState) {
                                                                        if(attendee.status === 'Present') {
                                                                            joined2 = true;
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                        })}
                                                        {(pending.truckId === selected.id || joined) ?
                                                            <TouchableOpacity onPress={() => {departShift(selected.id); departPending(selected.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 30, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#DE462A', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                {joined && <Text style={{color: 'white', fontWeight: 900, fontSize: 12}}>DEPART COLLECTION</Text>}
                                                                {pending.truckId === selected.id && <Text style={{color: 'white', fontWeight: 900, fontSize: 12}}>DEPART COLLECTION <Text style={{fontWeight: 600}}>[PENDING]</Text></Text>}
                                                            </TouchableOpacity>
                                                            :
                                                            <TouchableOpacity disabled={(!isActiveByOther || activeByUser.driverID === userIDState || pending.length !== 0 || joined2) ? true : false} onPress={() => {joinShift(selected.id)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 50, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgb(242,190,45)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                                {(!isActiveByOther || activeByUser.driverID === userIDState || pending.length !== 0 || joined2) && <View style={{position: 'absolute', height: '200%', width: '200%', backgroundColor: '#C9C9C9', opacity: 0.4, zIndex: 5}} />}
                                                                <Text style={{color: 'white', fontWeight: 900}}>JOIN COLLECTION</Text>
                                                            </TouchableOpacity>
                                                        }
                                                    </>
                                                }
                                            </View>
                                        }
                                    </>
                                    :
                                    <>
                                        <View style={{display: 'flex', flexDirection: 'row', flex: 0.8}}>
                                            <TouchableOpacity onPress={() => {setOpenAttendance(false)}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, marginTop: 10, marginHorizontal: 80, marginBottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgb(242,190,45)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                                <Text style={{color: 'white', fontWeight: 900}}>BACK</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                }
                            </View>
                            <TouchableOpacity onPress={() => {open(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                        </View>
                    </Modal>
                </>
                :
                <>
                    <TruckInfo truckID={truckID} setViewTruckFunction={closeInfo} />
                </>
            }
        </>
    );
}