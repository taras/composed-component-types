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
            let { context } = tree.meta;
            if (context) {
              let { microstate } = context.treeAt(tree.path);
              /**
               * I'm causing a side effect here, I'm not sure
               * if this is how we want to do this.
               */
              microstate[transition.name](...args);
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