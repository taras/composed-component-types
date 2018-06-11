import React from "react";
import { create, map } from "microstates";
import { filter, flatMap, append } from "funcadelic";

const { keys } = Object;

class Greeter {
  get message() {
    if (this.user) {
      return `Hello ${this.user.fullName}`;
    } else {
      return `no message`;
    }
  }
}

function withMicrostate(
  Component,
  { initialState, getDerivedStateFromProps = s => s }
) {
  class WrappedComponent extends React.Component {
    state = {
      microstate: map(
        root =>
          root.use(next => (...args) => {
            let nextState = next(...args);
            this.setState({ state: nextState });
            return nextState;
          }),
        initialState
      )
    };

    static getDerivedStateFromProps(props, state) {
      let { microstate } = state;

      let derived = getDerivedStateFromProps(props, state);

      let changed = filter(
        prop =>
          microstate[prop.key] &&
          microstate[prop.key].valueOf() !== prop.value.valueOf(),
        derived
      );

      if (keys(changed).length > 0) {
        return {
          state: flatMap(
            root =>
              flatMap(tree => {
                if (tree.is(root)) {
                  return tree.assign({
                    meta: {
                      children() {
                        return append(tree.children, changed);
                      }
                    }
                  });
                } else {
                  return tree;
                }
              }, root),
            state
          )
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
  ({ microstate }) => {
    return microstate.state.message;
  },
  {
    initialState: create(Greeter, {}),
    getDerivedStateFromProps: ({ session }) => ({ session })
  }
);
