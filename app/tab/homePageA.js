import React from 'react';
import { fetchUserId } from '../../components/userService';
import CommentOverlay from '../../components/commentOverlay';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image , Share, Modal} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { parse } from 'date-fns';
import uuid from 'react-native-uuid';
import moment from 'moment';
import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, getDoc, query, where, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL,  uploadBytes} from 'firebase/storage';
import SideBar from '../../components/SideNav';

export default function NewsfeedAut({navigation}) {
    const isFocused = useIsFocused();
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();

    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [userFeedUploads, setUserFeedUploads] = useState([]);
    const [imageFeedCol, setImageFeedCol] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [postText, setPostText] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [commentText, setCommentText] = useState('');

    const todayDate = getCurrentDate();

    const [selectedImage, setSelectedImage] = useState(null);
    let uploadCollection = [];

    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");
    const reportFeedRef = firebase.firestore().collection("posts");
    const imageFeedColRef = ref(storage, "FeedpostImages/");

    const [reportsToday, setReportsToday] = useState(0);
    const [totalReports, setTotalReports] = useState(0);

    const [isAllPressed, setIsAllPressed] = useState(true);
    const [isEventsPressed, setIsEventsPressed] = useState(false);
    const [userEvents, setUserEvents] = useState([]);


    const handleAllPress = () => {
        setIsAllPressed(true);
        setIsEventsPressed(false);
      };
    
      const handleEventsPress = () => { 
        setIsEventsPressed(true);
        setIsAllPressed(false);
      };
    
    const toggleModal = () => {
      setModalVisible(!isModalVisible);
      setSelectedImage('');
     };

     const fullDateTime = moment()
     .utcOffset('+08:00')
     .format('YYYY/MM/DD hh:mm:ss a');

     const formatTimestamp = (timestamp) => {
        // Assuming timestamp is in the format 'yyyy/MM/dd hh:mm:ss a'
        const formattedDate = moment(timestamp, 'YYYY/MM/DD hh:mm:ss a').format('YYYY/MM/DD hh:mm:ss a');
        return formattedDate;
    }; 

     useEffect(() => {
      const fetchEvents = async () => {
      try {
        const eventsData = await getDocs(collection(db, 'schedule'));
        const events = eventsData.docs.map((doc) => {
          const eventData = doc.data();
          if (eventData.type === 'Event') {
            return {
              id: doc.id,
              description: eventData.description,
              location: eventData.location,
              startTime: eventData.startTime,
              selectedDate: eventData.selectedDate,
              title: eventData.title,
              userId: eventData.userID,
              timestamp: eventData.dateTimeUploaded,
            };
          }
          return null; // Ignore non-event documents
        }).filter(event => event !== null);
  
        // Fetch user information for each event
        const userIds = events.map(event => event.userId);
        const eventUsers = await getUsersByIds(userIds);
  
        const enrichedEvents = events.map((event, index) => ({
          ...event,
          userName: eventUsers[index] ? `${eventUsers[index].firstName} ${eventUsers[index].lastName}` : 'Unknown User',
        }));
  
        setUserEvents(enrichedEvents);
      } catch (error) {
        console.error('Error fetching events: ', error);
          }
      };
          // Fetch events when the component mounts
          fetchEvents();
        }, []);
        
        const getUsersByIds = async (userIds) => {
          try {
        
            // Filter out undefined values from the userIds array
            const validUserIds = userIds.filter(userId => userId !== undefined);
        
            const users = await Promise.all(
              validUserIds.map(async (userId) => {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  return userDoc.data();
                }
                return null;
              })
            );
        
            return users.filter(user => user !== null);
          } catch (error) {
            console.error('Error fetching users: ', error);
            return [];
          }
        };  

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
                try {
                const data = await getDocs(usersCollection);
                const fetchedUsers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                setUsers(fetchedUsers);
                } catch (error) {
                console.error('Error fetching users: ', error);
                }
            };
            getUsers()

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
            reportFeedRef.onSnapshot(
                querySnapshot => {
                    const feedUploads = []
                    querySnapshot.forEach((doc) => {
                        const {imageUrl, postContent, timestamp, userId} = doc.data();
                        feedUploads.push({
                            id: doc.id,
                            imageUrl, 
                            postContent, 
                            timestamp,
                            userId
                        })
                    })
                    setUserFeedUploads(feedUploads) 
                    
                    listAll(imageFeedColRef).then((response) => {
                        setImageFeedCol([]); 
                        response.items.forEach((item) => {
                            getDownloadURL(item).then((url) => {
                            setImageFeedCol((prev) => [...prev, url]) 
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

 const handleLike = async (postId) => {
        try {
          // Check if the post is already liked
          const isAlreadyLiked = likedPosts.includes(postId);
    
          // Toggle the liked status
          const newLikedPosts = isAlreadyLiked
            ? likedPosts.filter((id) => id !== postId)
            : [...likedPosts, postId];
    
          // Update the state
          setLikedPosts(newLikedPosts);
    
          const userId = await fetchUserId();

          // Update the liked status in the database
          await updateLikesInDatabase(postId, userId, !isAlreadyLiked);
        } catch (error) {
          console.error('Error liking/unliking post: ', error);
        }
      }; 
    
      const updateLikesInDatabase = async (postId, userId, isLiked) => {
        try {
            const likesRef = collection(db, 'likes');
            const likedPostQuery = query(likesRef, where('postId', '==', postId), where('userId', '==', userId));
            const likedPostSnapshot = await getDocs(likedPostQuery);
    
            if (!likedPostSnapshot.empty) {
                likedPostSnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            } else {
                await addDoc(collection(db, 'likes'), {
                    postId,
                    userId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error updating likes in the database: ', error);
        }   
    };
    
    const handlePost = async () => {
      if (postText.trim() === '') {
          alert('Please enter a content.');
          return;
      }
  
      let userId;
  
      try {
          let imageUrl = '';
  
          if (selectedImage) {
              const imageName = uuid.v1(); // Generating a random name using uuid
              const imageDestination = 'FeedpostImages/' + imageName;
  
              userId = await fetchUserId();
              if (!userId) {
                  alert('Error fetching user ID.');
                  return;
              }
  
              const response = await fetch(selectedImage);
              const blob = await response.blob();
              const imageRef = ref(storage, imageDestination);
              await uploadBytes(imageRef, blob);
              imageUrl = imageName;
              alert('Image Uploaded');
          } else {
              userId = await fetchUserId();
              if (!userId) {
                  alert('Error fetching user ID.');
                  return;
              }
          }

          const postData = {
              postContent: postText,
              imageUrl,
              userId,
              timestamp: fullDateTime,
          };
  
          // Continue with the post creation logic, including imageUrl or without it
          const postRef = await addDoc(collection(db, 'posts'), postData);
  
          // Reset state values
          setPostTitle('');
          setPostText('');
          setSelectedImage('');
          setModalVisible(false);

           // Check if the number of posts exceeds 500
          const postsQuery = query(collection(db, 'posts'));
          const postsSnapshot = await getDocs(postsQuery);
          const numPosts = postsSnapshot.size;
          if (numPosts > 500) {
          const sortedPostsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'asc'));
          const sortedPostsSnapshot = await getDocs(sortedPostsQuery);
          const oldestPost = sortedPostsSnapshot.docs[0];
          // Delete the oldest post
          await deleteDoc(doc(db, 'posts', oldestPost.id));
          }
      } catch (error) {
          console.error('Error adding post: ', error);
      }
  };
     
    function getCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const todayDate = new Date().toLocaleDateString(undefined, options);
      
        return todayDate;
      }
  
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

    useEffect(() => {
      if(!isFocused) {
          setOpenSideBar();
      }
  });

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const userId = await fetchUserId();

        if (userId) {
          const likedPostsRef = collection(db, 'likes');
          const userLikedPostsQuery = query(likedPostsRef, where('userId', '==', userId));
          const userLikedPostsSnapshot = await getDocs(userLikedPostsQuery);
          const likedPostsIds = userLikedPostsSnapshot.docs.map(doc => doc.data().postId);
          setLikedPosts(likedPostsIds);
        }
      } catch (error) {
        console.error('Error fetching liked posts: ', error);
      }
    };

    fetchLikedPosts();
  }, []);
   
        const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                // Set the selected image URI to state
                setSelectedImage(result.uri);
            }
        } catch (error) {
            console.error('Error picking image: ', error);
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
        const [isCommentOverlayVisible, setIsCommentOverlayVisible] = useState({});
        const [postComments, setPostComments] = useState({});
        const [currentPostId, setCurrentPostId] = useState(null);

        const handleToggleCommentOverlay = async (postId) => {
            setCurrentPostId(postId);
            setIsCommentOverlayVisible((prevState) => ({
            ...prevState,
            [postId]: !prevState[postId],
            }));

            try {
            const commentsRef = collection(db, 'comments');
            const postCommentsQuery = query(commentsRef, where('postId', '==', postId));
            const postCommentsSnapshot = await getDocs(postCommentsQuery);
            const commentsData = postCommentsSnapshot.docs.map((doc) => doc.data().content);
            setPostComments((prevComments) => ({ ...prevComments, [postId]: commentsData }));
            } catch (error) {
            console.error('Error fetching comments: ', error);
            }
        };

        const handlePostComment = async (postId, commentText) => {
            try {
                if (!commentText || commentText.trim() === '') {
                    console.log('Comment cannot be empty.');
                    return;
                }
        
                const user = auth.currentUser;
        
                if (!user) {
                    console.error('User not authenticated.');
                    return;
                }
        
                // Fetch the user ID
                const currentUserId = await fetchUserId();
        
                if (!currentUserId) {
                    console.error('Error fetching user ID.');
                    return;
                }
        
                // Get the current username
                const currentUser = users.find((u) => u.id === currentUserId);
        
                if (!currentUser) {
                    console.error('Current user not found:', currentUserId);
                    console.log('All users:', users);
                    return;
                }
        
                const currentUsername = currentUser?.username || 'Unknown User';
        
                // Prepare the comment data
                const commentData = {
                    postId: postId,
                    userId: currentUserId,
                    username: currentUsername,
                    content: commentText,
                    timestamp: fullDateTime,
                };
        
                // Add the comment to the 'comments' collection
                await addDoc(collection(db, 'comments'), commentData);
        
                // Fetch the updated comments for the current post
                const commentsRef = collection(db, 'comments');
                const postCommentsQuery = query(commentsRef, where('postId', '==', postId));
                const postCommentsSnapshot = await getDocs(postCommentsQuery);
                const commentsData = postCommentsSnapshot.docs.map((doc) => doc.data().content);
        
                // Update the local state to display the updated comments
                setPostComments((prevComments) => ({
                    ...prevComments,
                    [postId]: commentsData,
                }));
        
                // Clear the commentText state
                setCommentText('');
            } catch (error) {
                console.error('Error posting comment: ', error);
            }
        };

        let temp = [];
        if(isAllPressed){
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
                if (fa > fb) {
                    return -1;
                }
                if (fa < fb) {
                    return 1;
                }
                return 0;
            });
        });
    
            userFeedUploads.map((FeedUploads) => {
                var valueFeedToPush = {};
                valueFeedToPush["id"] = FeedUploads.id;
                valueFeedToPush["imageUrl"] = FeedUploads.imageUrl;
                valueFeedToPush["postContent"] = FeedUploads.postContent;
                valueFeedToPush["dateTime"] = FeedUploads.timestamp;
                valueFeedToPush["userId"] = FeedUploads.userId;
                uploadCollection.push(valueFeedToPush);
                uploadCollection.sort((a, b) => {
                    let fa = a.dateTime,
                        fb = b.dateTime;
                    if (fa > fb) {
                        return -1;
                    }
                    if (fa < fb) {
                        return 1;
                    }
                    return 0;
                });
            });
            
            const getUserInfo = (userId) => {
                const user = users.find((user) => user.id === userId);
                return user ? `${user.firstName} ${user.lastName}` : `User (${userId})`;
            };
        
            uploadCollection.map((post,postFeed, index) => {
                let imageURL;
                if (post.imageLink) {
                  imageURL = imageCol.find((url) => url.includes(post.imageLink));
                } else if (post.imageUrl) {
                  imageURL = imageFeedCol.find((url) => url.includes(post.imageUrl));
                }
                
                temp.push(
                    <View key={`${post.id}-${postFeed.id}`} style={[styles.contentButton, styles.contentGap]}>
                      <TouchableOpacity activeOpacity={0.5}>
                        <View style={styles.contentButtonFront}>
                          {/* User information */}
                          <View style={{ width: '93%', flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 15 }}>
                            <View style={styles.containerPfp}> 
                              <Ionicons name='person-outline' style={styles.placeholderPfp} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'rgba(113, 112, 108, 1)', flexShrink: 1 }}>
                                  {getUserInfo(post.userId)}
                                </Text>
                                <Text style={{ fontSize: 12, color: 'gray', marginLeft: 5 }}>
                                    {formatTimestamp(post.dateTime) || formatTimestamp(postFeed.dateTime)}
                                    </Text>
                              </View>
                            </View>
                          </View>
                          <SafeAreaView style={{ width: '100%', marginVertical: 10, paddingHorizontal: 20, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)' }}>
                            <Text style={{ fontSize: 13, marginBottom: 5, marginStart: -1 }}>{post.description || post.postContent}</Text>
                            {imageURL ? (
                              <View style={{ width: '100%', height: 250, backgroundColor: '#D6D6D8', marginVertical: 5, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: imageURL }} style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'cover' }} />
                              </View>
                            ) : null}
                          </SafeAreaView>
                          <View style={{ width: '90%', flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                          <TouchableOpacity activeOpacity={0.5} onPress={() => handleLike(post.id)}>
                            <Ionicons
                                name={likedPosts.includes(post.id) ? 'heart' : 'heart-outline'}
                                style={{ fontSize: 25, color: likedPosts.includes(post.id) ? 'red' : 'black' }}
                            />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => handleToggleCommentOverlay(post.id)}>
                              <Ionicons name='chatbubble-outline' style={{ fontSize: 25 }} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5}>
                              <Ionicons
                                name="share-outline"
                                style={{ fontSize: 25 }}
                                onPress={() => handleSharePress(post.id || postFeed.id, post.description || post.postContent, imageURL)}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {/* Comment overlay */}
                      {isCommentOverlayVisible[post.id] && (
                        <CommentOverlay
                          comments={postComments[post.id] || []}
                          commentText={commentText}
                          setCommentText={setCommentText}
                          handlePostComment={() => handlePostComment(post.id, commentText)}
                        />
                      )}
                    </View>
                  );                  
                });
            return (
                <View>
                     {temp.length > 0 ? temp : <Text>No data to display</Text>}
                </View>
                );      
            }
            else if (isEventsPressed) {
                return (
                  <View>
                    {userEvents.map((event) => (
                      <View key={event.id} style={[styles.contentButton, styles.contentGap]}>
                        <View style={styles.contentButtonFront}>
                          {/* User information */}
                          <View style={{ width: '93%', flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 15 }}>
                            <View style={styles.containerPfp}>
                              <Ionicons name='person-outline' style={styles.placeholderPfp} />
                            </View> 
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'rgba(113, 112, 108, 1)' }}>
                                 {event.userId && users.find((user) => user.id === event.userId)?.username || 'Unknown User'}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'rgba(113, 112, 108, 1)', marginLeft: 50,}}>
                                {event.timestamp || 'invalid date'}
                            </Text>
                          </View>                     
                          <SafeAreaView style={{ width: '100%', marginVertical: 10, paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)' }}>
                            <Text style={{ fontSize: 16, color: 'green' }}>
                                {event.title} 
                            </Text>
                            <Text style={{ fontSize: 14, marginBottom: 5 }}>
                                {event.description}{'\n\n'}
                                <Text style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="location" size={16} color="green" style={{ marginRight: 5 }} />
                                    {event.location}{'\n'}
                                </Text>
                                <Text style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="calendar" size={16} color="green" style={{ marginRight: 5 }} />
                                    {event.selectedDate} at {event.startTime}
                                </Text>
                            </Text>
                            </SafeAreaView>
                          < View style={{ width: '90%', flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => handleLike(event.id)}>
                              <Ionicons name={likedPosts.includes(event.id) ? 'heart' : 'heart-outline'}
                                style={{ fontSize: 25, color: likedPosts.includes(event.id) ? 'red' : 'black' }} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => handleToggleCommentOverlay(event.id)}>
                              <Ionicons name='chatbubble-outline' style={{ fontSize: 25 }} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5}>
                              <Ionicons
                                name="share-outline"
                                style={{ fontSize: 25 }}
                                onPress={() => handleSharePress(event.id, event.selectedDate, event.location, event.title, event.description)}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {isCommentOverlayVisible[event.id] && (
                          <CommentOverlay
                            comments={postComments[event.id] || []}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            handlePostComment={() => handlePostComment(event.id, commentText)}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                );
              }
            }
  
      function HeaderContent() {
        return (
            <>
                <View style={{flexDirection: 'row', gap: 7, top: -20}}>
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
                            <TouchableOpacity activeOpacity={0.5} onPress={toggleModal} >
                                <View style={{backgroundColor: '#ffffff', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center'}}>
                                    <View style={[styles.containerPfp, {width: 30, height: 30}]}>
                                        <Ionicons name='person-outline' style={[styles.placeholderPfp, {fontSize: 20}]} />
                                    </View>
                                    <Text style={{left: 15}}>
                                        What's on your mind?
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnMainContainer}>
                            <View style={[styles.buttonContainer]}>
                            <TouchableOpacity activeOpacity={0.5} onPress={handleAllPress}>
                                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',  backgroundColor: isAllPressed ? 'rgb(179, 229, 94)' : 'white' }}>
                                            <Text style={{ fontWeight: 700, fontSize: 12, color: 'rgb(113, 112, 108)' }}>All</Text>
                                        </View>
                                    </TouchableOpacity>
                            </View>
                            <View style={[styles.buttonContainer]}>
                            <TouchableOpacity activeOpacity={0.5} onPress={handleEventsPress}>
                                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: isEventsPressed ? 'rgb(179, 229, 94)' : 'white' }}>
                                            <Text style={{ fontWeight: 700, fontSize: 12, color: 'rgb(113, 112, 108)' }}>Events</Text>
                                        </View>
                             </TouchableOpacity>
                            </View>
                            </View>
                        {BodyContent()}
                    </SafeAreaView>
                </SafeAreaView>
            </ScrollView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => {
                    setModalVisible(!isModalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            placeholder="Write your post content here..."
                            multiline
                            value={postText}
                            onChangeText={(text) => setPostText(text)}
                            style={styles.modalTextInput}
                        />
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={{ width: '100%', height: 150, marginBottom: 10, borderRadius: 5 }}
                            />
                        )}
                        <TouchableOpacity style={styles.modalChooseButton} onPress={handleImagePick}>
                            <Ionicons name="image-outline" style={{ fontSize: 20, color: 'white', marginRight: 5 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Choose Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={handlePost}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>POST</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={toggleModal}>
                            <Text style={{ color: 'black' }}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
        height: 180,
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
        paddingTop: 50,
    },
    body: {
        position: 'relative',
        width: 330,
        backgroundColor: 'rgb(228,237,229)',
        paddingTop: 10,
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
        elevation: 3,
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
    contentGap: {
      marginBottom: 10,
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
        color: 'green',
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
        height: 25,
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
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
      
    },
    modalTitleInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 10,
        padding: 10,
    },
    modalTextInput: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 10,
        padding: 10,
    },
    modalButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 2,
    },
    modalChooseButton: {
        backgroundColor: '#FFCB3C',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalCloseButton: {
        backgroundColor: 'lightgray',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
    },
});

