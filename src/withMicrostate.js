import React from 'react';
import { Tree, from } from "microstates";
import { map, filter, flatMap, append } from "funcadelic";
const { keys } = Object;


export default function withMicrostate(
  Component,
  { initial = from({}), getMicrostatesFromProps = s => s }
) {
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
              let nextValue = contextFreeTarget.microstate[transition.name](...args);
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
      let { microstate } = state;

      let fromProps = getMicrostatesFromProps(props, state);

      let changed = filter(prop => {
        return (
          !microstate[prop.key] ||
          (microstate[prop.key] &&
            microstate[prop.key].valueOf() !== prop.value.valueOf())
        );
      }, fromProps);

      if (keys(changed).length > 0) {
        let combined = map(treeRoot => {
          return flatMap(tree => {
            if (tree.is(treeRoot)) {
              return tree.assign({
                meta: {
                  children() {
                    let newChildren = map(state => {
                      return map(tree => tree.assign({ 
                        meta: {
                          context: tree.root
                        }                
                      }), Tree.from(state));
                    }, changed);
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