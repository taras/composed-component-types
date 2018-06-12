import React from "react";
import { create } from "microstates";
import { User } from "./index";
import withMicrostate from "./withMicrostate";

class Greeter {
  salutation = String;
  user = User;
  get updated() {
    return new Date().toLocaleTimeString();
  }
  get message() {
    if (this.user) {
      return `${this.salutation} ${this.user.fullName}`;
    } else {
      return `no message`;
    }
  }
}

const Hello = ({ microstate }) => (
  <fieldset>
    <legend>COMPONENT</legend>
    <p>{microstate.state.message}</p>
    <p>
      <label>
        Change salutation:{" "}
        <input
          onChange={e => microstate.salutation.set(e.target.value)}
          value={microstate.salutation.state}
        />
      </label>
    </p>
    <p>
      <label>
        Change first name:{" "}
        <input
          onChange={e => microstate.user.firstName.set(e.target.value)}
          onBlur={e => microstate.user.firstName.set(e.target.value)}
          value={microstate.user.firstName.state}
        />
      </label>
    </p>
    <p>
      Last updated: {microstate.state.updated}
    </p>
  </fieldset>
)

export default withMicrostate(Hello,
  {
    initial: create(Greeter, { salutation: "Hello" }),
    getMicrostatesFromProps: ({ user }) => ({ user })
  }
);
