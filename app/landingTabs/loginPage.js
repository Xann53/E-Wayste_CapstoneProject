import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db, auth, storage, firebase } from "../../firebase_config";
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setUserId } from "firebase/analytics";

export default function Login({navigation}) {
  const usersCollection = collection(db, "users");
  const userRef = firebase.firestore().collection("users");

  const [usernameEmail, setUsernameEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);
  const [users, setUsers] = useState([]);
  const [showChangePass, setShowChangePass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [idForEdit, setIdForEdit] = useState('');
  const [emailForEdit, setEmailForEdit] = useState('');

  useEffect(() => {
    const onSnapshot = snapshot => {
      const newData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
      }));
      setUsers(newData);
    };
    const unsubscribe = userRef.onSnapshot(onSnapshot);
    return () => {
        unsubscribe();
    };
  }, [])

  function SignIn() {

    if (usernameEmail.trim() === "" || password.trim() === "") {
      alert("Please fill up all required fields.");
      return;
    }

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
      let lguCode;

      users.map((user) => {
        if (user.username === usernameEmail.trim()) {
          usernameUsed = true;
        }
      })

      if(usernameUsed) {
        users.map((user) => {
          if (user.username === usernameEmail.trim()) {
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
            if(user.lguCode !== undefined)
              lguCode = user.lguCode;
            else
              lguCode = 'N/A';
          }
        })
      } else if(!usernameUsed) {
        email = usernameEmail.trim();
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
            if(user.lguCode !== undefined)
              lguCode = user.lguCode;
            else
              lguCode = 'N/A';
          }
        })
      }

      try {
        await signInWithEmailAndPassword(auth, email,  password.trim());
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
        await AsyncStorage.setItem('userLguCode', lguCode);

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
          await AsyncStorage.getItem('userLguCode')
        );

        Redirect(email);
      } catch(error) {
        alert("Incorrect username or password.");
      }
    };

    const loginCol = async() => {
      users.map(async(user) => {
        if(user.username === usernameEmail.trim() && user.password === password.trim()) {
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
          lguCode = user.lguCode;

          await AsyncStorage.clear();
          await AsyncStorage.setItem('userId', accountId);
          await AsyncStorage.setItem('userType', accountType);
          await AsyncStorage.setItem('userFName', firstName);
          await AsyncStorage.setItem('userLName', lastName);
          await AsyncStorage.setItem('userUName', username);
          await AsyncStorage.setItem('userProvince', province);
          await AsyncStorage.setItem('userMunicipality', municipality);
          await AsyncStorage.setItem('userBarangay', barangay);
          await AsyncStorage.setItem('userContact', contactNo);
          await AsyncStorage.setItem('userLguCode', lguCode);
          await AsyncStorage.setItem('userEmail', email);

          clearForm();

          navigation.navigate('collectorRoute');
        }
      })
    }

    let showError = false;
    for(let i = 0; i < users.length; i++) {
      if((users[i].email === usernameEmail.trim() || users[i].username === usernameEmail.trim()) && (users[i].accountType === 'Residents / General Users' || users[i].accountType === 'LGU / Waste Management Head')) {
        loginUser();
        showError = false;
        break;
      } else if((users[i].username === usernameEmail.trim()) && (users[i].accountType === 'Pending') && (users[i].password === password.trim())) {
        setIdForEdit(users[i].id);
        setEmailForEdit(users[i].username + '@gmail.com')
        setShowChangePass(true);
        showError = false;
        break;
      } else if((users[i].username === usernameEmail.trim()) && (users[i].accountType === 'Garbage Collector')) {
        loginCol();
        showError = false;
        break;
      } else {
        showError = true;
      }
    }
    if(showError) {
      alert('Account not found.');
    }
  }

  async function ChangePassFunction() {
      if(newPass !== '' && confirmPass !== '') {
         if(newPass === confirmPass) {
            const userDoc = doc(db, 'users', idForEdit);
            await updateDoc(userDoc, {
               accountType: 'Garbage Collector',
               password: newPass,
               email: emailForEdit
            });
            clearForm();
            setShowChangePass(false);
         } else {
            alert('Confirm Password does not match.');
         }
      } else {
         alert("Please fill up all required fields.");
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
    setNewPass("");
    setConfirmPass("");
  }

  function clearForm2() {
   setNewPass("");
   setConfirmPass("");
 }

  return (
    <>
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
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                onChangeText={(e) => {setPassword(e)}}
              />
              <TouchableOpacity
                style={styles.passwordIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  style={{fontSize: 20, color: 'green'}}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View  style={styles.divide} />
          <View style={styles.containerBtn}>
            <View style={styles.button1}>
              <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={() => { SignIn() }}>
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
      {showChangePass && (
        <>
          <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                <View style={{position: 'absolute', display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                    <View style={{display: 'flex', flex: 0.85, backgroundColor: 'white', padding: 10, borderRadius: 15, gap: 10, alignItems: 'center'}}>
                    <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 10}}>
                            <View style={{display: 'flex', flex: 1}} />
                            <View style={{display: 'flex', flex: 10, alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{fontSize: 18, color: 'green', fontWeight: 900}}>UPDATE PASSWORD</Text>
                            </View>
                            <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {setShowChangePass(false); clearForm2()}} style={{display: 'flex', backgroundColor: 'orange', padding: 2, paddingHorizontal: 6, borderRadius: 5}}>
                                    <Text style={{color: 'white', fontWeight: 900}}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>New Password</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1.7}}>
                                <TextInput
                                    value={newPass}
                                    onChangeText={(val) => {setNewPass(val)}}
                                    style={{
                                        backgroundColor: 'rgb(189,227,124)',
                                        color: 'rgb(45,105,35)',
                                        borderRadius: 5,
                                        paddingHorizontal: 6,
                                        fontSize: 13
                                    }}
                                    secureTextEntry={!showPassword2}
                                />
                                 
                                 <TouchableOpacity style={styles.passwordIcon2} onPress={() => {!showPassword2 ? setShowPassword2(true) : setShowPassword2(false)}}>
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} style={{fontSize: 20, color: 'green'}} />
                                 </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Confirm Password</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1.7}}>
                                <TextInput
                                    value={confirmPass}
                                    onChangeText={(val) => {setConfirmPass(val)}}
                                    style={{
                                        backgroundColor: 'rgb(189,227,124)',
                                        color: 'rgb(45,105,35)',
                                        borderRadius: 5,
                                        paddingHorizontal: 6,
                                        fontSize: 13
                                    }}
                                    secureTextEntry={!showPassword3}
                                />

                                 <TouchableOpacity style={styles.passwordIcon2} onPress={() => {!showPassword3 ? setShowPassword3(true) : setShowPassword3(false)}}>
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} style={{fontSize: 20, color: 'green'}} />
                                 </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity activeOpacity={0.7} onPress={() => {ChangePassFunction()}} style={{padding: 6, paddingHorizontal: 17, backgroundColor: 'rgb(220,130,47)', borderRadius: 20, marginTop: 10}}>
                            <Text style={{color: 'white', fontWeight: 800, fontSize: 13}}>CHANGE PASSWORD</Text>
                        </TouchableOpacity>

                    </View>
                    <TouchableOpacity onPress={() => {setShowChangePass(false); clearForm2()}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                </View>
            </Modal>
        </>
      )}
    </>
  );
}

// Things to Change in database
// -Password
// -Account type
// -Add Email

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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordIcon: {
    position: 'absolute',
    right: 10,
  },
  passwordIcon2: {
   position: 'absolute',
   top: 3,
   right: 7,
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
    padding: 10,
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
    padding: 10,
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
    padding: 10,
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