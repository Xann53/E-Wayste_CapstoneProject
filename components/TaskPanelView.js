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

export default function TaskView({ open }) {
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
    const [selectedCol, setSelectedCol] = useState([]);
    const [selectedAssign, setSelectedAssign] = useState([]);
    const [selectedRep, setSelectedRep] = useState([]);

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
        userRef.onSnapshot(
            querySnapshot => {
              const uploads = []
              querySnapshot.forEach((doc) => {
                const {accountType, username, firstName, lastName, province, municipality, barangay, email, contactNo, lguCode} = doc.data();
                uploads.push({
                  id: doc.id, accountType, username, firstName, lastName, province, municipality, barangay, email, contactNo, lguCode
                })
              })
              setAllUsers(uploads)
            }
          )
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

    return(
        <>
            <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                <View style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', padding: 20}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: 'white', height: '85%', borderRadius: 15, padding: 10}}>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <View style={{display: 'flex', flex: 1}} />
                            <View style={{display: 'flex', flex: 10, flexDirection: 'row', justifyContent: 'center'}}>
                                <Text style={{fontSize: 18, fontWeight: 900, letterSpacing: 1, color: 'green'}}>TASK LIST</Text>
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
                                    <Text>Reports</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setFilter('Collections')}} activeOpacity={0.7} disabled={filter === 'Collections' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Collections' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                    <Text>Collections</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setFilter('Assignments')}} activeOpacity={0.7} disabled={filter === 'Assignments' ? true : false} style={{display: 'flex', flex: 1, padding: 5, alignItems: 'center', borderRadius: 100, backgroundColor: filter === 'Assignments' ? 'rgb(242,190,45)' : 'white', shadowColor: 'black', shadowOpacity: 1, elevation: 2}}>
                                    <Text>Assignments</Text>
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
                                                        if(sched.userID === user.id && user.lguCode === userLguCode && sched.type === 'Collection') {
                                                            return(
                                                                <TouchableOpacity key={sched.id} onPress={() => {}}>
                                                                    <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 5, gap: 15, borderWidth: selectedCol.id === sched.id ? 3 : 0, borderColor: 'orange'}}>
                                                                        <View style={{display: 'flex', flexDirection: 'row'}}>
                                                                            <View style={{display: 'flex', flex: 4, justifyContent: 'center', overflow: 'hidden'}}>
                                                                                <Text numberOfLines={viewInfo !== sched.id ? 1 : 999} style={{fontWeight: 600, fontSize: 16, color: '#B47707'}}>{sched.description}</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 0.5, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                                <TouchableOpacity onPress={() => {viewInfo !== sched.id ? setViewInfo(sched.id) : setViewInfo('')}} style={{paddingLeft: 5}}>
                                                                                    <Ionicons name={viewInfo === sched.id ? "document-text-outline" : "document-text"} style={{fontSize: 25, color: 'orange'}} />
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        </View>
                                                                        {viewInfo === sched.id &&
                                                                            <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Date and Time</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.selectedDate} {sched.startTime}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                {sched.collectionRoute.coordinates.map((coord) => {
                                                                                    return (
                                                                                        <View key={coord.name} style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                            <View style={{display: 'flex', flex: 1, alignItems: 'flex-end', marginTop: 5}}>
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
                                                        if(sched.userID === user.id && user.lguCode === userLguCode && sched.type === 'Assignment') {
                                                            return(
                                                                <TouchableOpacity key={sched.id} onPress={() => {}}>
                                                                    <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 5, gap: 15, borderWidth: selectedAssign.id === sched.id ? 3 : 0, borderColor: 'orange'}}>
                                                                        <View style={{display: 'flex', flexDirection: 'row'}}>
                                                                            <View style={{display: 'flex', flex: 4, justifyContent: 'center', overflow: 'hidden'}}>
                                                                                <Text numberOfLines={viewInfo !== sched.id ? 1 : 999} style={{fontWeight: 600, fontSize: 16, color: '#B47707'}}>{sched.description}</Text>
                                                                            </View>
                                                                            <View style={{display: 'flex', flex: 0.5, alignItems: 'flex-end', overflow: 'hidden'}}>
                                                                                <TouchableOpacity onPress={() => {viewInfo !== sched.id ? setViewInfo(sched.id) : setViewInfo('')}} style={{paddingLeft: 5}}>
                                                                                    <Ionicons name={viewInfo === sched.id ? "document-text-outline" : "document-text"} style={{fontSize: 25, color: 'orange'}} />
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                        </View>
                                                                        {viewInfo === sched.id &&
                                                                            <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Date and Time</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.selectedDate} {sched.startTime}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end', marginTop: 5}}>
                                                                                        <Text style={{fontSize: 13}}>Location</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.location}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Latitude</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.latitude}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Longitude</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.longitude}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Status</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 2, backgroundColor: '#FFDC95', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{sched.status}</Text>
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
                                                    return(
                                                        <TouchableOpacity key={report.id} onPress={() => {}}>
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
                                                                        {viewInfo === report.id &&
                                                                            <View style={{display: 'flex', flex: 1, gap: 5}}>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end', marginTop: 5}}>
                                                                                        <Text style={{fontSize: 13}}>Location</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 3, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{report.location}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                                        <Text style={{fontSize: 13}}>Latitude</Text>
                                                                                    </View>
                                                                                    <View style={{display: 'flex', flex: 3, backgroundColor: '#DCF3B6', padding: 5, borderRadius: 5, overflow: 'hidden'}}>
                                                                                        <Text style={{fontSize: 13}}>{report.latitude}</Text>
                                                                                    </View>
                                                                                </View>
                                                                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center'}}>
                                                                                    <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
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
                        {/* {allShift.map((shift) => {
                            if(shift.driverId === userID) {
                                isDriver = true;
                                allActiveTask.map((active) => {
                                    if(shift.id === active.shiftId) {
                                        isActive = true;
                                        isActiveId = active.taskId;
                                    }
                                })
                            }
                        })} */}
                        <View style={{display: 'flex', flex: 0.8, marginTop: 10, justifyContent: 'center', alignItems: 'center'}}>
                            {/* {isDriver &&
                                <>
                                    {(selectedCol.id === isActiveId || selectedAssign.id === isActiveId || selectedRep.id === isActiveId) ? 
                                        <TouchableOpacity onPress={() => {}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: '#DE462A', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                            <Text style={{color: 'white', fontWeight: 900}}>END TRACK</Text>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity disabled={((selectedCol.id === undefined && selectedAssign.id === undefined && selectedRep.id === undefined) || isActive) ? true : false} onPress={() => {}} activeOpacity={0.7} style={{display: 'flex', flex: 1, padding: 5, width: '60%', alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: 'rgba(126,185,73,1)', shadowColor: 'black', shadowOpacity: 1, elevation: 2, overflow: 'hidden'}}>
                                            {((selectedCol.id === undefined && selectedAssign.id === undefined && selectedRep.id === undefined) || isActive) && <View style={{position: 'absolute', height: '200%', width: '200%', backgroundColor: '#C9C9C9', opacity: 0.4, zIndex: 5}} />}
                                            <Text style={{color: 'white', fontWeight: 900}}>TRACK</Text>
                                        </TouchableOpacity>
                                    }
                                </>
                            } */}
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => {open(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                </View>
            </Modal>
        </>
    );
}