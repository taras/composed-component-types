import React from "react";
import { Tree, Microstate } from "microstates";
import { map, flatMap, append } from "funcadelic";

export default function withMicrostate(Component, initial) {
  class WrappedComponent extends React.Component {
    state = {
      microstate: map(
        root =>
          root.use(next => (microstate, transition, args) => {
            let tree = Tree.from(microstate);
            // if the context was set, it means that this microstate
            // came via props from the context
            let { context } = tree.meta;
            if (context) {
              // lets get the corresponding tree in the context
              let contextTarget = context.treeAt(tree.path);
              // compare that this transition will actually change the value
              // if it doesn't then we can treat it as a no-op
              let contextFreeTarget = contextTarget.prune();
              let nextValue = contextFreeTarget.microstate[transition.name](
                ...args
              );
              let computedNextValueTree = Tree.from(nextValue);
              if (computedNextValueTree.isEqual(contextFreeTarget)) {
                // value has not change, it's a no-op
              } else {
                // cause a side effect(not sure if actually want this)
                contextTarget.microstate[transition.name](...args);
              }
              return this.state.microstate;
            } else {
              let nextState = next(microstate, transition, args);
              this.setState({ microstate: nextState });
              return nextState;
            }
          }),
        initial
      )
    };

    static getDerivedStateFromProps(props, state) {
      let microstate = map(treeRoot => {
        return flatMap(tree => {
          if (tree.is(treeRoot)) {
            return tree.assign({
              meta: {
                children() {

                  // map the state cause it has all of the composed types
                  let newChildren = map((state, childName) => {
                    // ignore the actual state cause we don't really need the state value
                    let child = tree.children && tree.children[childName];
                    let prop = props[childName];
                    if (prop && prop instanceof Microstate) {
                      let incomingTree = Tree.from(prop);
                      return child && child.isEqual(incomingTree)
                        ? child
                        : map(tree => tree.assign({ meta: { context: tree.root } }), incomingTree);
                    } else {
                      return child;
                    }
                  }, tree.microstate.state);

                  return append(tree.children, newChildren);
                }
              }
            });
          } else {
            return tree;
          }
        }, treeRoot);
      }, state.microstate);

      return {
        microstate
      };
    }

    render() {
      return <Component {...this.props} microstate={this.state.microstate} />;
    }
  }

  return WrappedComponent;
}
