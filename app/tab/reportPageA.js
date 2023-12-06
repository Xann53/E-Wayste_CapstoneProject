import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query, where} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { Circle } from 'react-native-progress';


import SideBar from '../../components/SideNav';

export default function ReportAut({navigation}) {
    const isFocused = useIsFocused();
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();

    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    let uploadCollection = [];

    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");

    const [reportsToday, setReportsToday] = useState(0);
    const [totalReports, setTotalReports] = useState(0);

    const [collectedCount, setCollectedCount] = useState(0);
    const [uncollectedCount, setUncollectedCount] = useState(0);
   
    const [circleSize, setCircleSize] = useState(100); 
    const [circleThickness, setCircleThickness] = useState(10); 
    const [progress1, setProgress1] = useState(0); // Initialize progress1
    const [progress2, setProgress2] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
          const reportsCollection = collection(db, "generalUsersReports");
          const collectedQuery = query(reportsCollection, where("status", "==", "collected"));
          const uncollectedQuery = query(reportsCollection, where("status", "==", "uncollected"));
          const collectedSnapshot = await getDocs(collectedQuery);
          const uncollectedSnapshot = await getDocs(uncollectedQuery);
          setProgress1(collectedSnapshot.size);
          setProgress2(uncollectedSnapshot.size);
        };
    
        fetchData();
      }, []);
  
    useEffect(() => {
      const fetchData = async () => {
        const reportsCollection = collection(db, 'generalUsersReports');
        const collectedQuery = query(reportsCollection, where('status', '==', 'collected'));
        const uncollectedQuery = query(reportsCollection, where('status', '==', 'uncollected'));
  
        const collectedSnapshot = await getDocs(collectedQuery);
        const uncollectedSnapshot = await getDocs(uncollectedQuery);
  
        setCollectedCount(collectedSnapshot.size);
        setUncollectedCount(uncollectedSnapshot.size);
      };
  
      fetchData();
    }, []);

    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0]; // Get the current date
    
        const fetchReports = async () => {
          try {
            // Query for reports today   
            const todayQuery = query(collection(db, 'generalUsersReports'), where('dateTime', '==', currentDate));
            const todaySnapshot = await getDocs(todayQuery);
            const reportsTodayCount = todaySnapshot.size;
            setReportsToday(reportsTodayCount);
    
            // Query for all reports
            const allReportsQuery = query(collection(db, 'generalUsersReports'));
            const allReportsSnapshot = await getDocs(allReportsQuery);
            const totalReportsCount = allReportsSnapshot.size;
            setTotalReports(totalReportsCount);
          } catch (error) {
            console.log('Error fetching reports:', error);
          }
        };
    
        fetchReports();
    }, []);



    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });

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
                    const {associatedImage, dateTime, description, location, status, userId} = doc.data();
                    uploads.push({
                        id: doc.id,
                        associatedImage,
                        dateTime,
                        description,
                        location,
                        status,
                        userId
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
    }, [])
    
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

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

    function BodyContent() {
        userUploads.map((uploads) => {
            var valueToPush = { };
            valueToPush["id"] = uploads.id;
            valueToPush["imageLink"] = uploads.associatedImage;
            valueToPush["dateTime"] = uploads.dateTime;
            valueToPush["description"] = uploads.description;
            valueToPush["location"] = uploads.location;
            valueToPush["status"] = uploads.status;
            valueToPush["userId"] = uploads.userId;
            uploadCollection.push(valueToPush);
            uploadCollection.sort((a, b) => {
                let fa = a.dateTime, fb = b.dateTime;
                if (fa < fb) {return -1;}
                if (fa > fb) {return 1;}
                return 0;
            });
        })

        let temp = [];
        uploadCollection.map((post) => {
            let imageURL;
            imageCol.map((url) => {
                if(url.includes(post.imageLink)) {
                    imageURL = url;
                }
            })

            temp.push(
                <View style={[styles.contentButton, styles.contentGap]}>
                    <TouchableOpacity activeOpacity={0.5}>
                        <View style={styles.contentButtonFront}>
                            <SafeAreaView style={{width: '100%', marginVertical: 10, paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)'}}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', fontWeight:'bold', paddingBottom: 5}}>REPORTS DETAILS </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Reported By:</Text> {users.map((user) => {if(post.userId === user.id) {return user.username;}})} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Date Reported:</Text> {post.dateTime} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Location</Text> {post.location} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Status of Report:</Text> {post.status} </Text>
                                <View style={{ width: '100%', height: 250, backgroundColor: 'white', marginVertical: 5,  justifyContent: 'flex-start', alignItems: 'flex-start'}}>
                                    {/* <Ionicons name='images-outline' style={{fontSize: 100, color: 'white'}} /> */}
                                    <Image src={imageURL} style={{width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10, justifyContent: 'flex-start'}} />
                                
                                </View>    
                            </SafeAreaView>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        });
        
        <ul>
            {temp.map(item =>
                <li key="{item}">{item}</li>
            )}
        </ul>

        return (
            <View style={{gap: 10}}>
                {temp}
            </View>
        );
    }

    function ViewAllContent() {
        let temp1 = [];
        imageCol.map((url) => {
            temp1.push(
                <TouchableOpacity activeOpacity={0.5}>
                    <View style={{ width: 80, height: 80, backgroundColor: '#D6D6D8', marginVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
                        {/* <Ionicons name='images-outline' style={{fontSize: 40, color: 'white'}} /> */}
                        <Image src={url} style={{width: '100%', height: '100%', flex: 1, resizeMode: 'cover'}} />
                    </View>
                </TouchableOpacity>
            );
        });
        
        <ul>
            {temp1.map(item =>
                <li key="{item}">{item}</li>
            )}
        </ul>

        return (
            <View style={{flexDirection: 'row', marginHorizontal: 10, gap: 10}}>
                {temp1}
            </View>
        );
    }
    function HeaderContent() {
        return (
            <>
                <Text style={{fontSize: 18, fontWeight: 700, color:'rgb(55,55,55)', textAlign: 'center'}}>REPORT ANNALYTICS</Text> 
                <View style={{flexDirection: 'row', gap: 5, top: 3}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 10, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>REPORTS TODAY</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 20, fontWeight: 700, color:'rgb(55,55,55)'}}>{reportsToday}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 10, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>TOTAL REPORT</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 20, fontWeight: 700, color:'rgb(55,55,55)'}}>{totalReports}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
               </View>
                <View style={{flexDirection: 'row', gap: 5, top: 3}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 10, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5, paddingTop: 5}}>UNCOLLECTED GARBAGE</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 20, fontWeight: 700, color:'rgb(55,55,55)'}}>{uncollectedCount}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 10, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5, paddingTop: 5}}>COLLECTED GARBAGE</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 20, fontWeight: 700, color:'rgb(55,55,55)'}}>{collectedCount}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
             
              </View>
          </>  
        );
    }


    return (
        <>
            {/*<View style={{ position: 'absolute', right: 20, bottom: 70, zIndex: 99, height: 60, width: 60, borderRadius: 100, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgb(81,175,91)', overflow: 'hidden' }}>
                <TouchableOpacity activeOpacity={0.5}>
                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name='add-circle' style={{ fontSize: 60, color: 'rgb(81,175,91)', top: -3, right: -0.9 }} />
                    </View>
                </TouchableOpacity>
            </View>*/}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                <SafeAreaView style={styles.container}>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                        <Ionicons name='menu' style={{ fontSize: 40, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 20, top: 31, zIndex: 99 }} onPress={() => {navigation.navigate('notification')}}>
                        <Ionicons name='notifications' style={{ fontSize: 35, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <View style={styles.header1}>
                        <View style={styles.header2}>
                            <Image
                                source={require('../../assets/NatureVector.jpg')}
                                style={{
                                    resizeMode: 'stretch',
                                    width: '100%',
                                    height: '150%',
                                    opacity: 0.5,
                                }}
                            />
                        </View>
                    </View>
                    <View style={styles.header3}>
                    {HeaderContent()}
                    </View>
                    <SafeAreaView style={styles.body}>
                        <View style={styles.chartContainer}>
                    {/* Outer Circle */}
                    {/* Progress Circle 1 */}
                    <View style ={styles.outerCircle}>
                            <Circle
                                size={circleSize}
                                indeterminate={false}
                                progress={progress1 / 100}
                                borderColor="transparent" // Change the color as needed
                                color="green"
                                unfilledColor="white"
                                thickness={circleThickness}
                            /><Text style={{ marginTop: -circleSize / 2 + circleThickness * 3, fontSize: 12, fontWeight: 'bold', color: 'rgb(55,55,55)' }}>
                             {progress1}%</Text>
                            
                     </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                <View style={styles.headerCntrCol}>
                                    {/* Green Square */}
                                </View>
                                 <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgb(55,55,55)' , marginLeft: 6}}>Collected Garbage</Text>
                         </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                    <View style={styles.headerCntrCol2}>
                                    {/* Yellow Square */}
                                        </View>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgb(55,55,55)', marginLeft:  5}}>Uncollected Garbage</Text>
                           </View>
    
                    <View style ={styles.innerCircle}>
                                {/* Progress Circle 2 */}
                            <Circle
                                size={circleSize - circleThickness * 3}
                                indeterminate={false}
                                progress={progress2 / 100}
                                borderColor="transparent" // Change the color as needed
                                color="yellow"
                                unfilledColor="#FAF9F6"
                                thickness={circleThickness}
                            />
                           <Text style={{ marginTop: -circleSize / 2 + circleThickness * 3, fontSize: 12, fontWeight: 'bold', color: 'rgb(55,55,55)' }}>
                             {progress2}%</Text>
                        </View>
              </View>
                        <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 23, fontWeight: 700, color: 'rgba(113, 112, 108, 1)', marginBottom: 10}}>REPORTS</Text>
                        </View>
                        <View>
                            <View style={{width: 315, backgroundColor: '#ffffff', borderRadius: 10, overflow: 'hidden', marginBottom: 20}}>
                                <View style={{ flexDirection: 'row', width: '100%' }}>
                                    <Text style={{ left: 10, marginTop: 15, fontWeight: 700 }}>REPORTS TODAY</Text>
                                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 15, marginTop: 15 }}>
                                        <Text style={{textDecorationLine: 'underline'}}>
                                            View all
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal={true}>
                                {ViewAllContent()}
                                </ScrollView>
                            </View>
                            {BodyContent ()}
                        </View>
                    </SafeAreaView>
                </SafeAreaView>
            </ScrollView>
            {openSideBar}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'rgb(246, 242, 239)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 60,
    },
    header1: {
        width: '100%',
        height: 252,
        backgroundColor: 'rgb(220, 130, 47)',
        zIndex: -50,
    },
    header2: {
        width: '100%',
        height: '90%',
        backgroundColor: 'rgb(134, 202, 81)',
        overflow: 'hidden',
        alignItems: 'center',
    },
    header3: {
        position: 'absolute',
        width: 310,
        height: 210,
        top: 70,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.30,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 50,
        alignItems: 'center',
        paddingTop: 10,
        
    },
    body: {
        position: 'relative',
        width: 330,
        backgroundColor: 'rgb(228,237,229)',
        paddingTop: 50,
        paddingBottom: 10,
        alignItems: 'center',
    },
    headerCntr: {
        width: 110,
        height: 57,
        backgroundColor: 'rgb(255,248,172)',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentButton: {
        width: 315,
        backgroundColor: 'rgb(230, 230, 230)',
        borderRadius: 5,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 3,
            height: 3,
        },
        shadowOpacity: 1,
        shadowRadius: 1,
        elevation: 5,
    },
    contentButtonFront: {
        width: '100%',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'rgba(113, 112, 108, 1)',
    },
    containerPfp: {
        width: 35,
        height: 35,
        backgroundColor: '#D6D6D8',
        borderRadius: 55,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderPfp: {
        fontSize: 25,
        color: 'rgba(113, 112, 108, 1)',
    },

    chartContainer: {
        width: 300,
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E6E6E6',
        backgroundColor: '#F5F5DC',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',   
        
      },
      outerCircle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingBottom: 10,
      },
      innerCircle: {
        position: 'absolute',
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 45,
      
        
      },
      headerCntrChart :{

        width: 50,
        height: 50,
        backgroundColor: 'rgb(255,248,172)',
        borderRadius: 57 / 2,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',    

      },
      headerCntrCol: {
        width: 13,
        height: 13,
        marginBottom: 7,
        marginRight: 10,
        backgroundColor: 'green',
       
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCntrCol2: {
        width: 13,
        height: 13,
        backgroundColor: 'yellow',
        overflow: 'hidden',
       
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
})