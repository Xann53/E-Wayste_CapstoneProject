import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase_config';

const CommentOverlay = ({ comments = [], commentText, setCommentText, handlePostComment }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);

        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <View style={styles.overlayContainer}>
      {comments.map((comment, index) => {
        return (
          <View key={index} style={[styles.commentContainer, styles.commentBackground]}>
            <Icon name="person" size={20} color="blue" />
            <Text style={styles.commentText}>
              {comment}
            </Text>
          </View>
        );
      })}

      <TextInput
        placeholder="Add a comment..."
        value={commentText}
        onChangeText={(text) => setCommentText(text)}
        style={styles.commentInput}
      />

      <TouchableOpacity onPress={handlePostComment} style={styles.postButton}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentBackground: {
    backgroundColor: 'lightgray',
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  commentText: {
    marginLeft: 8,
    marginBottom: 8,
  },
  userName: {
    fontWeight: 'bold',
  },
  commentInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 8,
    padding: 8,
  },
  postButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CommentOverlay;
