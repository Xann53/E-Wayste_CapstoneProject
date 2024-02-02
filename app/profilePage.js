import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function Profile({navigation}) {
    const [users, setUsers] = useState([]);
    const [id, setId] = useState();
    const [username, setUsername] = useState();
    const [name, setName] = useState();
    const [province, setProvince] = useState();
    const [municipality, setMunicipality] = useState();
    const [barangay, setBarangay] = useState();
    const [email, setEmail] = useState();
    const [contactNo, setContactNo] = useState();

    const [editUsername, setEditUsername] = useState();
    const [editFirstName, setEditFirstName] = useState();
    const [editLastName, setEditLastName] = useState();
    const [editProvince, setEditProvince] = useState();
    const [editMunicipality, setEditMunicipality] = useState();
    const [editBarangay, setEditBarangay] = useState();
    const [editEmail, setEditEmail] = useState();
    const [editContactNo, setEditContactNo] = useState();

    const [edit, setEdit] = useState(false);

    const reportRef = firebase.firestore().collection("users");
    
    useEffect(() => {
        reportRef.onSnapshot(
            querySnapshot => {
                const uploads = []
                querySnapshot.forEach((doc) => {
                    const {accountType, username, firstName, lastName, province, municipality, barangay, email, contactNo} = doc.data();
                    uploads.push({
                        id: doc.id,
                        accountType,
                        username,
                        firstName,
                        lastName,
                        province,
                        municipality,
                        barangay,
                        email,
                        contactNo
                    })
                })
                setUsers(uploads)
            }
        )
    }, []);

    function Body() {
        const retrieveUserData = async (userID) => {
            users.map((user) => {
                if(user.id === userID) {
                    setId(user.id);
                    setUsername(user.username);
                    setName(user.firstName + ' ' + user.lastName);
                    setProvince(user.province);
                    setMunicipality(user.municipality);
                    setBarangay(user.barangay);
                    setEmail(user.email);
                    setContactNo(user.contactNo);

                    setEditUsername(user.username);
                    setEditFirstName(user.firstName);
                    setEditLastName(user.lastName)
                    setEditProvince(user.province);
                    setEditMunicipality(user.municipality);
                    setEditBarangay(user.barangay);
                    setEditEmail(user.email);
                    setEditContactNo(user.contactNo);  
                }
            })
        };

        const retrieveID = async () => {
            const userID = await AsyncStorage.getItem('userId');
            retrieveUserData(userID);
        };
        retrieveID();
        return (
            <ScrollView contentContainerStyle={{flexGrow:1}}>
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>PROFILE</Text>
                    <View style={styles.containerPfp}>
                        <Ionicons name='person-outline' style={styles.placeholderPfp} />
                    </View>
                    <Text style={styles.usernamePfp}>{username}</Text>
                    <TouchableOpacity style={styles.editProfile} onPress={() => {
                        if (!edit) {
                            setEdit(true);
                        } else if (edit) {
                            setEdit(false);
                        }
                    }}>
                        <Text style={{color:'rgb(81,175,91)'}}>Edit Profile</Text>
                        <Ionicons name='create-outline' style={{color:'rgb(81,175,91)'}} />
                    </TouchableOpacity>
                    <View style={styles.containerFrm}>
                        <View style={styles.containerInfoDisplay}>
                            <Text style={styles.containerInfoTxt}>Username</Text>
                            <Text style={styles.containerInfoTxt}>Name</Text>
                            <Text style={styles.containerInfoTxt}>Province</Text>
                            <Text style={styles.containerInfoTxt}>Municipality</Text>
                            <Text style={styles.containerInfoTxt}>Barangay</Text>
                            <Text style={styles.containerInfoTxt}>Email</Text>
                            <Text style={styles.containerInfoTxt}>Phone Number</Text>
                        </View>
                        <View style={styles.containerInfoDisplay}>
                            <TextInput
                                value={username}
                                style={styles.input}
                                placeholder="Username"
                                editable={false}
                            />
                            <TextInput
                                value={name}
                                style={styles.input}
                                placeholder="Name"
                                editable={false}
                            />
                            <TextInput
                                value={province}
                                style={styles.input}
                                placeholder="Province"
                                editable={false}
                            />
                            <TextInput
                                value={municipality}
                                style={styles.input}
                                placeholder="Municipality"
                                editable={false}
                            />
                            <TextInput
                                value={barangay}
                                style={styles.input}
                                placeholder="Barangay"
                                editable={false}
                            />
                            <TextInput
                                value={email}
                                style={styles.input}
                                placeholder="Email"
                                editable={false}
                            />
                            <TextInput
                                value={contactNo}
                                style={styles.input}
                                placeholder="Phone Number"
                                editable={false}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </ScrollView>
        );
    }

    function EditProfile() {
        const updateUser = async () => {
          // Check for empty fields
          if (
            !editUsername ||
            !editFirstName ||
            !editLastName ||
            !editProvince ||
            !editMunicipality ||
            !editBarangay ||
            !editEmail ||
            !editContactNo
          ) {
            alert("Please fill up all fields.");
            return;
          }
      
          const userDoc = doc(db, "users", id);
          const newFields = {
            username: editUsername,
            firstName: editFirstName,
            lastName: editLastName,
            province: editProvince,
            municipality: editMunicipality,
            barangay: editBarangay,
            email: editEmail,
            contactNo: editContactNo,
          };
          await updateDoc(userDoc, newFields);
          alert("Profile Updated");
      
          // Reset the edit mode
          setEdit(false);
        };
      
        return (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <SafeAreaView style={styles.container}>
              <Text style={styles.title}>EDIT PROFILE</Text>
              <View style={styles.containerPfp}>
                <Ionicons name="person-outline" style={styles.placeholderPfp} />
              </View>
              <Text style={styles.usernamePfp}>{username}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={styles.editProfile2}
                  onPress={() => {
                    if (!edit) {
                      setEdit(true);
                    } else if (edit) {
                      setEdit(false);
                    }
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      padding: 7,
                      paddingHorizontal: 23,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "rgb(81,175,91)",
                    }}
                  >
                    <Text style={{ color: "rgb(81,175,91)", fontWeight: 700 }}>
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editProfile2}
                  onPress={() => {
                    updateUser();
                    if (!edit) {
                      setEdit(true);
                    } else if (edit) {
                      setEdit(false);
                    }
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgb(81,175,91)",
                      padding: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: 700 }}>
                      Save Profile
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.containerFrm2}>
                <View style={styles.containerInfoDisplay}>
                  <Text style={styles.containerInfoTxt}>Username</Text>
                  <Text style={styles.containerInfoTxt}>First Name</Text>
                  <Text style={styles.containerInfoTxt}>Last Name</Text>
                  <Text style={styles.containerInfoTxt}>Province</Text>
                  <Text style={styles.containerInfoTxt}>Municipality</Text>
                  <Text style={styles.containerInfoTxt}>Barangay</Text>
                  <Text style={styles.containerInfoTxt}>Email</Text>
                  <Text style={styles.containerInfoTxt}>Phone Number</Text>
                </View>
                <View style={styles.containerInfoDisplay}>
                  <TextInput
                    value={editUsername}
                    style={styles.input}
                    placeholder="Username"
                    editable={true}
                    onChangeText={(e) => {
                      setEditUsername(e);
                    }}
                  />
                  <TextInput
                    value={editFirstName}
                    style={styles.input}
                    placeholder="First Name"
                    editable={true}
                    onChangeText={(e) => {
                      setEditFirstName(e);
                    }}
                  />
                  <TextInput
                    value={editLastName}
                    style={styles.input}
                    placeholder="Last Name"
                    editable={true}
                    onChangeText={(e) => {
                      setEditLastName(e);
                    }}
                  />
                  <TextInput
                    value={editProvince}
                    style={styles.input}
                    placeholder="Province"
                    editable={true}
                    onChangeText={(e) => {
                      setEditProvince(e);
                    }}
                  />
                  <TextInput
                    value={editMunicipality}
                    style={styles.input}
                    placeholder="Municipality"
                    editable={true}
                    onChangeText={(e) => {
                      setEditMunicipality(e);
                    }}
                  />
                  <TextInput
                    value={editBarangay}
                    style={styles.input}
                    placeholder="Barangay"
                    editable={true}
                    onChangeText={(e) => {
                      setEditBarangay(e);
                    }}
                  />
                  <TextInput
                    value={editEmail}
                    style={styles.input}
                    placeholder="Email"
                    editable={true}
                    onChangeText={(e) => {
                      setEditEmail(e);
                    }}
                  />
                  <TextInput
                    value={editContactNo}
                    style={styles.input}
                    placeholder="Phone Number"
                    editable={true}
                    onChangeText={(e) => {
                      setEditContactNo(e);
                    }}
                  />
                </View>
              </View>
            </SafeAreaView>
          </ScrollView>
        );
      }

    return (
        <>
            {!edit ?
                <>
                    <TouchableOpacity style={{ position: 'absolute', right: 20, top: 31, zIndex: 99 }}  onPress={() => {navigation.navigate('home')}}>
                        <Ionicons name='home' style={{ fontSize: 35, color: 'rgb(81,175,91)' }} />
                    </TouchableOpacity>
                    {Body()}
                </>
                :
                <>
                    {EditProfile()}
                </>
            }
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 30,
    },
    containerFrm: {
        marginTop: 25,
        width: 330,
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden',
        flexDirection: 'row',
        gap: 20,
    },
    containerFrm2: {
        marginTop: 14,
        width: 330,
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden',
        flexDirection: 'row',
        gap: 20,
    },
    containerInfoTxt: {
        height: 40,
        marginVertical: 5,
        textAlignVertical: 'center',
        textAlign: 'right',
        color: 'rgba(113, 112, 108, 1)',
    },
    containerInfoDisplay: {
        gap: 10,
    },
    title: {
        position: 'absolute',
        top: 30,
        fontWeight: "700",
        fontSize: 25,
        color: 'rgba(113, 112, 108, 1)',
    },
    input: {
        height: 40,
        width: 200,
        paddingVertical: 0,
        paddingLeft: 10,
        backgroundColor: 'rgb(189,227,124)',
        borderRadius: 10,
        marginVertical: 5,
        color: 'rgba(45, 105, 35, 1)',
    },




    containerPfp: {
        marginTop: 100,
        width: 110,
        height: 110,
        backgroundColor: '#D6D6D8',
        borderRadius: 55,
        borderWidth: 2,
        borderColor: 'rgb(81,175,91)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderPfp: {
        fontSize: 70,
        color: 'white',
    },
    usernamePfp: {
        marginTop: 10,
        fontSize: 20,
        fontWeight: 500,
        color: 'rgba(113, 112, 108, 1)',
    },
    editProfile: {
        marginTop: 15,
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
    },
    editProfile2: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
    }
});