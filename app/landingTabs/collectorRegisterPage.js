import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image } from "react-native";
import { useState, useEffect } from "react";
import { SelectList } from "react-native-dropdown-select-list";
import CheckBox from "../../components/CheckBox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';
import uuid from 'react-native-uuid';
import moment from "moment";

import { db, auth, storage, firebase } from "../../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import * as ImagePicker from 'expo-image-picker';

export default function Registration2({ navigation }) {
    const [agree, setAgree] = useState(false);
    const [province, setProvince] = useState("");
    const [municipality, setMunicipality] = useState("");
    const [barangay, setBarangay] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [lguCode, setLguCode] = useState("");
    const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
    const [image, setImage] = useState(null);
    const [users, setUsers] = useState();
    const [pendingUser, setPendingUser] = useState();
    
    const usersCollection = collection(db, "pendingUsers");
    const usersRef = firebase.firestore().collection("users");
    const pendingUserRef = firebase.firestore().collection("pendingUsers");

    const ProvinceOfPhp = [
        { key: "Cebu", value: "Cebu" }
    ];

    let MunicipalityOfCebu = [];
    if(province === 'Cebu') {
        MunicipalityOfCebu = [
            { key: "Compostela", value: "Compostela" },
            { key: "Liloan", value: "Liloan" },
            { key: "Consolacion", value: "Consolacion" },
            { key: "Mandaue", value: "Mandaue" },
        ];
    }

    let BarangayOfcebu = [];
    if(municipality === 'Compostela') {
        BarangayOfcebu = [
            { key: "Bagalnga", value: "Bagalnga" },
            { key: "Basak", value: "Basak" },
            { key: "Buluang", value: "Buluang" },
            { key: "Cabadiangan", value: "Cabadiangan" },
            { key: "Cambayog", value: "Cambayog" },
            { key: "Canamucan", value: "Canamucan" },
            { key: "Cogon", value: "Cogon" },
            { key: "Dapdap", value: "Dapdap" },
            { key: "Estaca", value: "Estaca" },
            { key: "Lupa", value: "Lupa" },
            { key: "Magay", value: "Magay" },
            { key: "Mulao", value: "Mulao" },
            { key: "Panangban", value: "Panangban" },
            { key: "Poblacion", value: "Poblacion" },
            { key: "Tag‑ube", value: "Tag‑ube" },
            { key: "Tamiao", value: "Tamiao" },
            { key: "Tubigan", value: "Tubigan" },
        ];
    } else if(municipality === 'Liloan') {
        BarangayOfcebu = [
            { key: "Cabadiangan", value: "Cabadiangan" },
            { key: "Calero", value: "Calero" },
            { key: "Catarman", value: "Catarman" },
            { key: "Cotcot", value: "Cotcot" },
            { key: "Jubay", value: "Jubay" },
            { key: "Lataban", value: "Lataban" },
            { key: "Mulao", value: "Mulao" },
            { key: "Poblacion", value: "Poblacion" },
            { key: "San Roque", value: "San Roque" },
            { key: "San Vicente", value: "San Vicente" },
            { key: "Santa Cruz", value: "Santa Cruz" },
            { key: "Tabla", value: "Tabla" },
            { key: "Tayud", value: "Tayud" },
            { key: "Yati", value: "Yati" },
        ];
    } else if(municipality === 'Consolacion') {
        BarangayOfcebu = [
            { key: "Cabangahan", value: "Cabangahan" },
            { key: "Cansaga", value: "Cansaga" },
            { key: "Casili", value: "Casili" },
            { key: "Danglag", value: "Danglag" },
            { key: "Garing", value: "Garing" },
            { key: "Jugan", value: "Jugan" },
            { key: "Lamac", value: "Lamac" },
            { key: "Lanipga", value: "Lanipga" },
            { key: "Nangka", value: "Nangka" },
            { key: "Panas", value: "Panas" },
            { key: "Panoypoy", value: "Panoypoy" },
            { key: "Pitogo", value: "Pitogo" },
            { key: "Poblacion Occidental", value: "Poblacion Occidental" },
            { key: "Poblacion Oriental", value: "Poblacion Oriental" },
            { key: "Polog", value: "Polog" },
            { key: "Pulpogan", value: "Pulpogan" },
            { key: "Sacsac", value: "Sacsac" },
            { key: "Tayud", value: "Tayud" },
            { key: "Tilhaong", value: "Tilhaong" },
            { key: "Tolotolo", value: "Tolotolo" },
            { key: "Tugbongan", value: "Tugbongan" },
        ];
    } else if(municipality === 'Mandaue') {
        BarangayOfcebu = [
            { key: "Alang-alang", value: "Alang-alang" },
            { key: "Bakilid", value: "Bakilid" },
            { key: "Banilad", value: "Banilad" },
            { key: "Basak", value: "Basak" },
            { key: "Cabancalan", value: "Cabancalan" },
            { key: "Cambaro", value: "Cambaro" },
            { key: "Canduman", value: "Canduman" },
            { key: "Casili", value: "Casili" },
            { key: "Casuntingan", value: "Casuntingan" },
            { key: "Centro", value: "Centro" },
            { key: "Cubacub", value: "Cubacub" },
            { key: "Guizo", value: "Guizo" },
            { key: "Ibabao-Estancia", value: "Ibabao-Estancia" },
            { key: "Jagobiao", value: "Jagobiao" },
            { key: "Labogon", value: "Labogon" },
            { key: "Looc", value: "Looc" },
            { key: "Maguikay", value: "Maguikay" },
            { key: "Mantuyong", value: "Mantuyong" },
            { key: "Opao", value: "Opao" },
            { key: "Paknaan", value: "Paknaan" },
            { key: "Pagsabungan", value: "Pagsabungan" },
            { key: "Subangdaku", value: "Subangdaku" },
            { key: "Tabok", value: "Tabok" },
            { key: "Tawason", value: "Tawason" },
            { key: "Tingub", value: "Tingub" },
            { key: "Tipolo", value: "Tipolo" },
            { key: "Umapad", value: "Umapad" },
        ];
    }

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUsers(newData);

        };

        const unsubscribe = usersRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPendingUser(newData);

        };

        const unsubscribe = pendingUserRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    const retrieveData = async () => {
        if ((province && municipality && barangay && contactNo) && (province.length > 0 && municipality.length > 0 && barangay.length > 0 && contactNo.length > 0) && (image !== null)) {
            try {
                const accountType = await AsyncStorage.getItem('accountType');
                const firstName = await AsyncStorage.getItem('accountFName');
                const lastName = await AsyncStorage.getItem('accountLName');
                const username = await AsyncStorage.getItem('accountUName');
                const email = await AsyncStorage.getItem('accountEmail');
                const password = await AsyncStorage.getItem('accountPass');
                AsyncStorage.flushGetRequests();

                let proceed = true;
                pendingUser.map((user) => {
                    if(email === user.email) {
                        proceed = false;
                    }
                })
                users.map((user) => {
                    if(email === user.email) {
                        proceed = false;
                    }
                })

                if(proceed) {
                    createUser(accountType, firstName, lastName, username, email, password);
                } else if(!proceed) {
                    alert('The email that you have entered is already in use.');
                }
            } catch (error) {
                alert(error.message);
            }   
        } else {
            alert("Empty or Incomplete form! Unable to save data.");
        }
    }
    
    const createUser = async (accountType, firstName, lastName, username, email, password) => {
        const imageURI = image.uri;
        const imageName = imageURI.substring(imageURI.lastIndexOf('/') + 1);
        const finalImageName = uuid.v1() + imageName;
        const imageDestination = 'userWorkID/' + finalImageName;
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:mm:ss a');
        
        let proceed = false;
        users.map((user) => {
            if(lguCode === user.lguCode) {
                proceed = true;
            }
        })

        if(proceed) {
            const response = await fetch(imageURI);
            const blob = await response.blob();
            const imageRef = ref(storage, imageDestination);
            uploadBytes(imageRef, blob).then(() => {
                console.log("Image Uploaded");
            });

            await addDoc(usersCollection, {
                accountType: accountType,
                firstName: firstName,
                lastName: lastName,
                username: username,
                email: email,
                password: password,
                province: province,
                municipality: municipality,
                barangay: barangay,
                contactNo: contactNo,
                associatedImage: finalImageName,
                lguCode: lguCode,
                dateTime: fullDateTime
            });

            await AsyncStorage.clear();
            setImage(null);
            clearForm();
            Redirect();
        } else if(!proceed) {
            alert('You have entered an incorrect code. Ask your superiors for the correct code.');
        }
    };

    function clearForm() {
        setProvince("");
        setMunicipality("");
        setBarangay("");
        setContactNo("");
        setLguCode("");
    }

    function Redirect() {
        alert('Account details submitted. Pending ID verification.');
        navigation.navigate('landing');
    }

    useEffect(() => {
        (async () => {
            const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasGalleryPermission(galleryStatus.status === 'granted');
        })();
    }, [])
    
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1
            });
            console.log(result.assets[0]);
            setImage(result.assets[0]);
        } catch(e) {}
    }

    return (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={styles.container}>
                <View style={{position: 'absolute',width: '100%', alignItems: 'flex-start', top: 30, left: 20}}>
                    <TouchableOpacity onPress={() => {clearForm(); navigation.navigate('register'); setImage(null)}}>
                        <Ionicons name='arrow-back' style={{fontSize: 40, color: 'rgba(16, 139, 0, 1)'}} />
                    </TouchableOpacity>
                </View>
                <View style={styles.containerFrm}>
                    <Text style={styles.title}>CREATE ACCOUNT</Text>
                    <SelectList
                        setSelected={(e) => {setProvince(e)}}
                        data={ProvinceOfPhp}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Province"
                    />
                    <SelectList
                        setSelected={(e) => {setMunicipality(e)}}
                        data={MunicipalityOfCebu}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Municipality"
                    />
                    <SelectList
                        setSelected={(e) => {setBarangay(e)}}
                        data={BarangayOfcebu}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Barangay"
                    />
                    <TextInput
                        value={contactNo}
                        style={styles.input}
                        placeholder="Contact Number"
                        onChangeText={(e) => {setContactNo(e)}}
                    />
                    <TextInput
                        value={lguCode}
                        style={styles.input}
                        placeholder="Enter Code"
                        onChangeText={(e) => {setLguCode(e)}}
                    />
                    {!image ?
                        <View style={{marginTop: 10}}>
                            <Text style={{paddingLeft: 10, color: 'rgba(45, 105, 35, 1)', fontSize: 13, fontWeight: 700}}>JOB ID PHOTO</Text>
                            <TouchableOpacity activeOpacity={0.5} onPress={pickImage} style={{height: 200, width: 280, backgroundColor: '#EEF1ED', borderRadius: 20, justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{height: 150, width: 230, borderStyle: "dashed", borderWidth: 2, borderRadius: 20, borderColor: '#8E928C', justifyContent: 'center', alignItems: 'center'}}>
                                    <Ionicons name='image' style={{fontSize: 100, color: '#8E928C'}} />
                                    <Text style={{fontSize: 11, fontWeight: 700, color: '#8E928C'}}>Select Photo of ID from Gallery</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        :
                        <View style={{marginTop: 10}}>
                            <Text style={{paddingLeft: 10, color: 'rgba(45, 105, 35, 1)', fontSize: 13, fontWeight: 700}}>JOB ID PHOTO</Text>
                            <View style={{height: 200, width: 280, backgroundColor: '#EEF1ED', borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 5}}>
                                <TouchableOpacity activeOpacity={0.5} onPress={() => {setImage(null)}} style={{position: 'absolute', height: 20, width: 20, backgroundColor: 'white', borderRadius: 100, justifyContent: 'center', alignItems: 'center', zIndex: 100, top: 15, right: 15}}>
                                    <Ionicons name='close-circle' style={{fontSize: 20, left: 0.6, bottom: 0.6}} />
                                </TouchableOpacity>
                                <View style={{height: '100%', width: '100%'}}>
                                    <Image source={{uri: image.uri}} style={{flex: 1, resizeMode: 'cover', height: 1, borderRadius: 15}} />
                                </View>
                            </View>
                        </View>
                    }
                </View>
                <View style={styles.containerChkbx}>
                    <CheckBox
                        onPress={() => setAgree(!agree)}
                        title="I agree to the Terms and Conditions and Privacy Policy"
                        isChecked={agree}
                    />
                </View>
                <View style={styles.containerBtn}>
                    <View style={styles.button1}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={() => { retrieveData() }}>
                            <Text style={styles.buttonTxt1}>
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.button2}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5}>
                            <Text style={styles.buttonTxt2}>
                                Sign in with Google
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexDirection: 'row', gap: 5, alignItems: 'center', marginVertical: 10}}>
                        <Text style={{fontSize: 14, fontWeight: 500}}>Already have an account?</Text>
                        <TouchableOpacity activeOpacity={0.5} onPress={() => {clearForm(); navigation.navigate('login')}}>
                            <Text style={{color: 'rgb(0,123,0)', fontSize: 16, fontWeight: 900}}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
// Start Here
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    containerBtn: {
        marginTop: 30,
        gap: 10,
        marginBottom: 30
    },
    containerFrm: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    containerChkbx: {
        flexDirection: "row",
        marginTop: 15,
        left: -12,
        width: 260,
    },
    title: {
        fontWeight: "900",
        fontSize: 30,
        bottom: 20,
        color: 'rgba(16, 139, 0, 1)',
    },
    input: {
        height: 40,
        width: 270,
        paddingVertical: 0,
        paddingLeft: 10,
        backgroundColor: 'rgb(189,227,124)',
        borderRadius: 10,
        marginVertical: 5,
        // color: 'rgba(45, 105, 35, 1)',
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
        padding: 10,
        verticalAlign: 'middle',
        color: '#ffffff',
        fontWeight: '900',
    },
    button2: {
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
        padding: 10,
        verticalAlign: 'middle',
        color: 'rgb(81,175,91)',
        fontWeight: '900',
    },
});