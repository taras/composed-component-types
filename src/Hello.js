import React from "react";
import { create, Tree } from "microstates";
import { map, filter, flatMap, append } from "funcadelic";
import { User } from './index';
const { keys } = Object;

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

function withMicrostate(
  Component,
  { initialState, getMicrostatesFromProps = s => s }
) {
  class WrappedComponent extends React.Component {
    state = {
      microstate: map(
        root =>
          root.use(next => (...args) => {
            let nextState = next(...args);
            this.setState({ microstate: nextState });
            return nextState;
          }),
        initialState
      )
    };

    static getDerivedStateFromProps(props, state) {
      let { microstate } = state;

      let derived = getMicrostatesFromProps(props, state);

      let changed = filter(prop => {
        return (
          !microstate[prop.key] ||
          (microstate[prop.key] &&
            microstate[prop.key].valueOf() !== prop.value.valueOf())
        );
      }, derived);

      if (keys(changed).length > 0) {
        let combined = map(treeRoot => {
          return flatMap(tree => {
            if (tree.is(treeRoot)) {
              return tree.assign({
                meta: {
                  children() {
                    let newChildren = map(state => Tree.from(state), changed);
                    return append(tree.children, newChildren);
                  }
                }
              });
            } else {
              return tree;
            }
          }, treeRoot);
        }, microstate);

        return {
          microstate: combined
        };
      } else {
        return null;
      }
    }

    render() {
      return <Component {...this.props} microstate={this.state.microstate} />;
    }
  }

  return WrappedComponent;
}

export default withMicrostate(
  ({ microstate }) => (
    <fieldset>
      <legend>COMPONENT</legend>
      <p>{microstate.state.message}</p>
      <label>
        Change salutation:{" "}
        <input
          onChange={e => microstate.salutation.set(e.target.value)}
          value={microstate.salutation.state}
        />
      </label>
    </fieldset>
  ),
  {
    initialState: create(Greeter, { salutation: "Hello" }),
    getMicrostatesFromProps: ({ user }) => ({ user })
  }
);
