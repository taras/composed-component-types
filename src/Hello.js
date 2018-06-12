import React from "react";
import { create } from "microstates";
import { User } from "./index";
import withMicrostate from "./withMicrostate";

class Greeter {
  salutation = String;
  user = User;
  get message() {
    if (this.user) {
      return `${this.salutation} ${this.user.fullName}`;
    } else {
      return `no message`;
    }
  }
}

export default withMicrostate(
  ({ microstate }) => (
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
            value={microstate.user.firstName.state}
          />
        </label>
      </p>
    </fieldset>
  ),
  {
    initial: create(Greeter, { salutation: "Hello" }),
    getMicrostatesFromProps: ({ user }) => ({ user })
  }
);
