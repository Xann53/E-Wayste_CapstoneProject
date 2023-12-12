import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image , Share} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse } from 'date-fns';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query ,where, orderBy} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import SideBar from '../../components/SideNav';
import { TEST_ID } from 'react-native-gifted-chat';

export default function NewsfeedAut({navigation}) {
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


    const commentsCollection = collection(db, 'Comments');

    const [reportsToday, setReportsToday] = useState(0);
    const [totalReports, setTotalReports] = useState(0);

    useEffect(() => {
      const currentDate = new Date().toISOString().split('T')[0]; // Get the current date
  
      const fetchReports = async () => {
          try {
              // Query for reports today
              const todayQuery = query(collection(db, 'generalUsersReports'), where('dateTime', '>=', currentDate));
              const todaySnapshot = await getDocs(todayQuery);
              const todayReports = [];
  
              todaySnapshot.forEach(doc => {
                  const report = doc.data();
                  const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
  
                  if (reportDate.toISOString().split('T')[0] === currentDate) {
                      todayReports.push(report);
                  }
              });
  
              setReportsToday(todayReports.length);
  
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

    // Post Interaction 
    
  const [likedPosts, setLikedPosts] = useState([]);
  const isPostLiked = (postId) => likedPosts.includes(postId);

  const handleLikePress = (postId) => {
    setLikedPosts((prevLikedPosts) => {
      const updatedLikedPosts = new Set(prevLikedPosts);

      if (updatedLikedPosts.has(postId)) {
        updatedLikedPosts.delete(postId);
      } else {
        updatedLikedPosts.add(postId);
      }

      return Array.from(updatedLikedPosts);
    });
  };
  // comment 

  const [isCommentOverlayVisible, setCommentOverlayVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [postComments, setPostComments] = useState({});
  
  const handleCommentPress = (postId) => {
    // Toggle the visibility of the comment overlay
    setCommentOverlayVisible(!isCommentOverlayVisible);
    // Handle other logic related to the comment press if needed
  };
  const handlePostComment = async (postId, commentText) => {
    try {
      // Add the comment to the "comments" collection
      const commentsRef = collection(db, 'Comments');
      await addDoc(commentsRef, {
        postId,
        userId: auth.currentUser.uid,
        text: commentText,
        timestamp: new Date(),
        username: user.username,
      });
  
      // Clear the comment text after posting
      setCommentText('');
  
      // Update the postComments state
      setPostComments((prevComments) => {
        const updatedComments = {
          ...prevComments,
          [postId]: [...(prevComments[postId] || []), commentText],
        };
        return updatedComments;
      });
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };
  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        orderBy('timestamp', 'asc'),
        where('postId', '==', postId)
      );
  
      const snapshot = await getDocs(commentsQuery);
  
      const comments = snapshot.docs.map((doc) => doc.data().text);
      setPostComments((prevComments) => ({
        ...prevComments,
        [postId]: comments,
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    console.log('userUploads:', userUploads);
    // Fetch comments for each post
    userUploads.forEach((uploads) => {
      fetchComments(uploads.id);
    });
  }, [db, userUploads]);
  
  //Share

  const handleSharePress = async (postId, description, imageURL) => {
    try {
      const result = await Share.share({
        title: 'Check out this post!',
        message: `${description}\n\nImage: ${imageURL}`, // Include any additional details you want to share
      });
  
      if (result.action === Share.sharedAction) {
        console.log('Post shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Sharing dismissed');
      }
    } catch (error) {
      console.error('Error sharing post:', error.message);
    }
  };
  
  

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
          var valueToPush = {};
          valueToPush["id"] = uploads.id;
          valueToPush["imageLink"] = uploads.associatedImage;
          valueToPush["dateTime"] = uploads.dateTime;
          valueToPush["description"] = uploads.description;
          valueToPush["location"] = uploads.location;
          valueToPush["status"] = uploads.status;
          valueToPush["userId"] = uploads.userId;
          uploadCollection.push(valueToPush);
          uploadCollection.sort((a, b) => {
            let fa = a.dateTime,
              fb = b.dateTime;
            if (fa < fb) {
              return -1;
            }
            if (fa > fb) {
              return 1;
            }
            return 0;
          });
        });
      
        let temp = uploadCollection.map((post) => {
          let imageURL;
          imageCol.map((url) => {
            if (url.includes(post.imageLink)) {
              imageURL = url;
            }
          });
      
          return (
            <View style={[styles.contentButton, styles.contentGap]} key={post.id}>
              <TouchableOpacity activeOpacity={0.5}>
                <View style={styles.contentButtonFront}>
                  <View
                    style={{
                      width: '93%',
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                      marginTop: 15,
                    }}
                  >
                    <View style={styles.containerPfp}>
                      <Ionicons name="person-outline" style={styles.placeholderPfp} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: 'rgba(113, 112, 108, 1)',
                        }}
                      >
                        {users.map((user) => {
                          if (post.userId === user.id) {
                            return user.username;
                          }
                        })}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: 'rgba(113, 112, 108, 1)',
                          alignSelf: 'flex-end', 
                        }}
                      >
                        {post.dateTime} {/* Display the timestamp */}
                      </Text>
                    </View>
                  </View>
                  <SafeAreaView
                    style={{
                      width: '100%',
                      marginVertical: 10,
                      paddingHorizontal: 22,
                      paddingBottom: 5,
                      borderBottomWidth: 1,
                      borderColor: 'rgba(190, 190, 190, 1)',
                    }}
                  >
                    <Text style={{ fontSize: 13, marginBottom: 5 }}>{post.description}</Text>
                    <View
                      style={{
                        width: '100%',
                        height: 250,
                        backgroundColor: '#D6D6D8',
                        marginVertical: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: imageURL }}
                        style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'cover' }}
                      />
                    </View>
                  </SafeAreaView>
                  
                  <View style={{
                      width: '90%',
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name={isPostLiked(post.id) ? 'heart' : 'heart-outline'}
                      style={{ fontSize: 25, color: isPostLiked(post.id) ? 'red' : 'black' }}
                      onPress={() => handleLikePress(post.id)}
                    />
                  <Ionicons
                      name="chatbubble-outline"
                      style={{ fontSize: 25 }}
                      onPress={() => {
                        handleCommentPress(post.id);
                        setCommentOverlayVisible((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }));
                      }}
                    />
                    <Ionicons
              name="share-outline"
              style={{ fontSize: 25 }}
              onPress={() => handleSharePress(post.id, post.description, imageURL)}
            />
                  </View>
                </View>
              </TouchableOpacity>   
              <View>
              {isCommentOverlayVisible[post.id] && (
                <CommentOverlay
                comments={postComments[post.id] || []}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  handlePostComment={() => handlePostComment(post.id, commentText)}
                  
                />
              )}
              </View>
           </View>
          
        );
     });
      
        return <View style={{ gap: 10 }}>{temp}</View>;
      }
      

      function HeaderContent() {
        return (
            <>
                <Text style={{fontSize: 18, fontWeight: 700, color:'rgb(55,55,55)'}}>BANILAD, CEBU CITY</Text>
                <View style={{flexDirection: 'row', gap: 7, top: 5}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>REPORTS TODAY</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{reportsToday}</Text>
                            <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>TOTAL REPORT</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{totalReports}</Text>
                            <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                </View>
          </>
        );
      }

    return (
        <>
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
                        <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 23, fontWeight: 700, color: 'rgba(3, 73, 4, 1)', marginBottom: 5}}>NEWSFEED</Text>
                        </View>
                        <View style={{width: 315, backgroundColor: 'rgb(230, 230, 230)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgb(16, 139, 0)', marginBottom: 20}}>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {navigation.navigate('pagecamera')}}>
                                <View style={{backgroundColor: '#ffffff', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center'}}>
                                    <View style={[styles.containerPfp, {width: 30, height: 30}]}>
                                        <Ionicons name='person-outline' style={[styles.placeholderPfp, {fontSize: 20}]} />
                                    </View>
                                    <Text style={{left: 15}}>
                                        What's on your mind?
                                    </Text>
                                    <View style={{position: 'absolute', right:15, width: 70, height: 35, backgroundColor: 'rgb(45, 105, 35)', borderRadius: 20, overflow: 'hidden'}}>
                                        <TouchableOpacity activeOpacity={0.5}>
                                            <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(81,175,91)'}}>
                                                <Text style={{fontWeight: 700, color: '#ffffff'}}>POST</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnMainContainer}>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>All</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>Reports</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>Events</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            </View>
                        {BodyContent()}
                    </SafeAreaView>
                </SafeAreaView>
            </ScrollView>
            {openSideBar}
        </>
    );
    function CommentOverlay({ comments, commentText, setCommentText, handlePostComment }) {
      return (
        <View style={styles.commentOverlayContainer}>
          <View style={styles.commentContainer}>
            {comments.map((comment, index) => (
              <View key={index} style={styles.existingComment}>
                <Text>{comment}</Text>
              </View>
            ))}
          </View>
    
          {/* Input text for adding a new comment */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={(text) => setCommentText(text)}
              style={styles.input}
            />
            <TouchableOpacity onPress={handlePostComment}>
              <View style={styles.postButton}>
                <Text style={styles.postButtonText}>Post</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'rgb(246, 242, 239)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 40,
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
        top: 75,
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
        paddingTop: 20,
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
        width: 137,
        height: 90,
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

    container1: {
        fontSize: 18,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      headerContainer: {
        flexDirection: 'row',
        gap: 7,
        top: 5,
      },
      headerText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgb(55,55,55)',
        marginBottom: 5,
      },
      headerContentContainer: {
        alignItems: 'center',
      },
      headerContent: {
        fontSize: 40,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      headerContentText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      buttonContainer: {
        width: 70,
        height: 35,
        backgroundColor: 'rgb(179, 229, 94)',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        elevation: 3,
      },
      buttonText: {
        fontWeight: '700',
        fontSize: 15,
        color: 'rgb(113, 112, 108)',
      },
      btnMainContainer: {
        width: '100%',
        paddingHorizontal: 10,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10, marginTop: -10
      },
      // comments
      commentOverlayContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: 'rgba(190, 190, 190, 1)',
        borderRadius: 10,
      },
      commentContainer: {
        maxHeight: 150,
        overflowY: 'auto',
        padding: 10,
      },
      existingComment: {
        marginBottom: 5,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,        
      },
      input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        marginRight: 10,
        paddingLeft: 10,
      },
      postButton: {
        backgroundColor: 'rgb(81,175,91)',
        padding: 10,
        borderRadius: 5,
      },
      postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      
});

