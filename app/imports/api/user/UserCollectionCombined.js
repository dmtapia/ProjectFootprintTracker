import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
import { Roles } from 'meteor/alanning:roles';
import swal from 'sweetalert';
import BaseCollection from '../base/BaseCollection';

export const userPublications = {
  user: 'User',
  userAdmin: 'UserAdmin',
};

class UserCollectionCombined extends BaseCollection {
  constructor() {
    super('Users', new SimpleSchema({
      email: String,
      firstName: String,
      lastName: String,
      zipCode: Number,
      goal: String,
    }));
  }

  define({ email, firstName, lastName, zipCode, goal }) {
    const docID = this._collection.insert({
      email,
      firstName,
      lastName,
      zipCode,
      goal,
    });
    return docID;
  }

  defineWithMessage({ email, firstName, lastName, zipCode, goal }) {
    const docID = this._collection.insert({ email, firstName, lastName, zipCode, goal }, (error) => {
      if (error) {
        swal('Error', error.message, 'error');
      } else {
        swal('Sucess');
      }
    });
    return docID;
  }

  update(docID, { email, firstName, lastName, zipCode, goal }) {
    const updateData = {};

    if (email) {
      updateData.email = email;
    }

    if (firstName) {
      updateData.firstName = firstName;
    }

    if (lastName) {
      updateData.lastName = lastName;
    }

    if (_.isNumber(zipCode)) {
      updateData.zipCode = zipCode;
    }

    if (goal) {
      updateData.goal = goal;
    }

    this._collection.update(docID, { $set: updateData });
  }

  removeIt(name) {
    const doc = this.findDoc(name);
    check(doc, Object);
    this._collection.remove(doc._id);
    return true;
  }

  publish() {
    if (Meteor.isServer) {
      // get the TripCollection instance.
      const instance = this;
      /** This subscription publishes only the documents associated with the logged in user */
      Meteor.publish(userPublications.user, function publish() {
        if (this.userId) {
          const username = Meteor.users.findOne(this.userId).username;
          return instance._collection.find({ username: username });
        }
        return this.ready();
      });

      /** This subscription publishes all documents regardless of user, but only if the logged in user is the Admin. */
      Meteor.publish(userPublications.userAdmin, function publish() {
        if (this.userId && Roles.userIsInRole(this.userId, 'admin')) {
          return instance._collection.find();
        }
        return this.ready();
      });
    }
  }

  subscribeUser() {
    if (Meteor.isClient) {
      return Meteor.subscribe(userPublications.user);
    }
    return null;
  }

  subscribeUserAdmin() {
    if (Meteor.isClient) {
      return Meteor.subscribe(userPublications.userAdmin);
    }
    return null;
  }

  getUserProfile(email) {
    const user = this._collection.findOne({ email: email });
    return user;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const UsersCombined = new UserCollectionCombined();