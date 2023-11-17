import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';

import { db, auth } from '../../../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({navigation}) {
    const [usernameEmail, setUsernameEmail] = useState("");
    const [password, setPassword] = useState("");
    const [users, setUsers] = useState([]);

    const usersCollection = collection(db, "users");

    useEffect(() => {
        const getUsers = async () => {
            const data = await getDocs(usersCollection);

            setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
        };
        getUsers();
    }, [])

    const loginUser = async () => {
        let email;
        let usernameUsed = false;

        let accountId;
        let accountType;
        let firstName;
        let lastName;
        let username;
        let province;
        let municipality;
        let barangay;
        let contactNo;
        let plateNo;
        
        users.map((user) => {
            if(user.username === usernameEmail) {
                usernameUsed = true;
            }
        })

        if(usernameUsed) {
            users.map((user) => {
                if(user.username === usernameEmail) {
                    email = user.email;

                    accountId = user.id;
                    accountType = user.accountType;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    username = user.username;
                    province = user.province;
                    municipality = user.municipality;
                    barangay = user.barangay;
                    contactNo = user.contactNo;
                    if(user.plateNo !== undefined)
                        plateNo = user.plateNo;
                    else
                        plateNo = 'N/A';
                }
            })
        } else if(!usernameUsed) {
            email = usernameEmail;
            users.map((user) => {
                if(user.email === email) {
                    accountId = user.id;
                    accountType = user.accountType;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    username = user.username;
                    province = user.province;
                    municipality = user.municipality;
                    barangay = user.barangay;
                    contactNo = user.contactNo;
                    if(user.plateNo !== undefined)
                        plateNo = user.plateNo;
                    else
                        plateNo = 'N/A';
                }
            })
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            await AsyncStorage.clear();
            await AsyncStorage.setItem('userId', accountId);
            await AsyncStorage.setItem('userType', accountType);
            await AsyncStorage.setItem('userFName', firstName);
            await AsyncStorage.setItem('userLName', lastName);
            await AsyncStorage.setItem('userUName', username);
            await AsyncStorage.setItem('userEmail', email);
            await AsyncStorage.setItem('userProvince', province);
            await AsyncStorage.setItem('userMunicipality', municipality);
            await AsyncStorage.setItem('userBarangay', barangay);
            await AsyncStorage.setItem('userContact', contactNo);
            await AsyncStorage.setItem('userPlateNo', plateNo);
            
            console.log(
                await AsyncStorage.getItem('userId') + ", " +
                await AsyncStorage.getItem('userType') + ", " +
                await AsyncStorage.getItem('userFName') + ", " +
                await AsyncStorage.getItem('userLName') + ", " +
                await AsyncStorage.getItem('userUName') + ", " +
                await AsyncStorage.getItem('userEmail') + ", " +
                await AsyncStorage.getItem('userProvince') + ", " +
                await AsyncStorage.getItem('userMunicipality') + ", " +
                await AsyncStorage.getItem('userBarangay') + ", " +
                await AsyncStorage.getItem('userContact') + ", and " +
                await AsyncStorage.getItem('userPlateNo')
            );

            Redirect(email);
        } catch(error) {
            alert(error.message);
        }
    }

    function Redirect(email) {
        let navTo;
        
        users.map((user) => {
            if(user.email === email) {
                navTo = user.accountType;
            }
        })

        clearForm();
        
        if (navTo === 'Residents / General Users') {
            navigation.navigate('userRoute');
        }
        if (navTo === 'LGU / Waste Management Head') {
            navigation.navigate('authorityRoute');
        }
        if (navTo === 'Garbage Collector') {
            navigation.navigate('collectorRoute');
        }
    }

    function clearForm() {
        setUsernameEmail("");
        setPassword("");
    }

    return (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={styles.container}>
                <View style={{position: 'absolute',width: '100%', alignItems: 'flex-start', top: 30, left: 20}}>
                    <TouchableOpacity onPress={() => {clearForm(); navigation.navigate('landing')}}>
                        <Ionicons name='arrow-back' style={{fontSize: 40, color: 'rgba(16, 139, 0, 1)'}} />
                    </TouchableOpacity>
                </View>
                <View style={styles.containerFrm}>
                    <Text style={styles.title}>LOG IN ACCOUNT</Text>
                    <TextInput
                        value={usernameEmail}
                        style={styles.input}
                        placeholder="Username / Email"
                        onChangeText={(e) => {setUsernameEmail(e)}}
                    />
                    <TextInput
                        value={password}
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry={true}
                        onChangeText={(e) => {setPassword(e)}}
                    />
                </View>
                <View  style={styles.divide}>
                    <View style={styles.divideLine} />
                    <Text style={styles.divLineTxt}>or log in with</Text>
                </View>
                <View style={styles.containerBtn}>
                    <View style={styles.button3}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5}>
                            <Text style={styles.buttonTxt3}>
                                <Text style={styles.googleBlue}>G</Text>
                                <Text style={styles.googleRed}>O</Text>
                                <Text style={styles.googleYellow}>O</Text>
                                <Text style={styles.googleBlue}>G</Text>
                                <Text style={styles.googleGreen}>L</Text>
                                <Text style={styles.googleRed}>E</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.button1}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={() => { loginUser() }}>
                            <Text style={styles.buttonTxt1}>
                                Sign in
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text>Don't have an account yet?</Text>
                    <View style={styles.button2}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={() => { clearForm(); navigation.navigate('register') }}>
                            <Text style={styles.buttonTxt2}>
                                Create an Account
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 550,
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    containerBtn: {
        top: 290,
        gap: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerFrm: {
        justifyContent: 'center',
        alignItems: 'center',
        top: 215,
    },
    title: {
        fontWeight: "900",
        fontSize: 30,
        bottom: 25,
        color: 'rgba(16, 139, 0, 1)',
    },
    input: {
        height: 40,
        width: 270,
        paddingVertical: 0,
        paddingLeft: 10,
        backgroundColor: 'rgb(189,227,124)',
        borderRadius: 10,
        marginVertical: 7,
        color: 'rgba(45, 105, 35, 1)',
    },
    divide: {
        width: '100%',
        top: 255,
        alignItems: 'center',
    },
    divideLine: {
        width: '80%',
        height: 0,
        borderTopWidth: 1,
        zIndex: -50,
        borderColor: 'rgba(16, 139, 0, 1)',
        overflow:'visible',
    },
    divLineTxt: {
        top: -11,
        backgroundColor: 'white',
        width: 100,
        textAlign: 'center',
    },
    button1: {
        width: 220,
        height: 45,
        backgroundColor: 'rgba(45, 105, 35, 1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(81,175,91)',
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
    buttonTxt1: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgb(81,175,91)',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: '#ffffff',
        fontWeight: '900',
    },
    button2: {
        top: -10,
        width: 220,
        height: 45,
        backgroundColor: 'rgba(203, 203, 203, 1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(81,175,91)',
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
    buttonTxt2: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: 'rgb(81,175,91)',
        fontWeight: '900',
    },
    button3: {
        top: -30,
        width: 145,
        height: 38,
        backgroundColor: 'rgba(203, 203, 203, 1)',
        borderRadius: 25,
        borderWidth: 2,
        borderBottomWidth: 1.62,
        borderTopColor: 'rgb(228,65,52)',
        borderBottomColor: 'rgb(50,163,80)',
        borderLeftColor: 'rgb(242,182,5)',
        borderRightColor: 'rgb(64,130,237)',
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
    buttonTxt3: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        fontWeight: '900',
        flexDirection: 'row',
    },
    googleBlue: {
        color: 'rgb(64,130,237)',
    },
    googleRed: {
        color: 'rgb(228,65,52)',
    },
    googleYellow: {
        color: 'rgb(242,182,5)',
    },
    googleGreen: {
        color: 'rgb(50,163,80)',
    },
});