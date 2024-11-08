"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";


Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [groups, setGroups] = useState<Array<Schema["Group"]["type"]>>([]);
  const [selectedGroup, setSelectedGroup] = useState<Schema["Group"]["type"] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const { signOut,user } = useAuthenticator();

  // Fetch all groups
  function listGroups(isInitial = false) {
    client.models.Group.observeQuery().subscribe({
      next: (data) => {
        if(isInitial || groups.length === 0){
          setGroups([...data.items])
          setSelectedGroup(data.items[0])
        }else{
          setGroups([...data.items])
        }
      },
    });
  }

  // Fetch todos of the selected group
  function listTodos(groupId: string) {
    client.models.Todo.observeQuery({
      filter: { groupId: { eq: groupId } },
    }).subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  // Join a new group
  function joinGroup() {
    if (!!inputValue) {
      client.models.Group.create({ groupName: inputValue }).then(() => {
        listGroups();
        setInputValue('');
      });
    }
  }

  // Create a todo in the selected group
  function createTodo() {
    if (selectedGroup) {
      const content = window.prompt("Todo content:");
      if (content) {
        client.models.Todo.create({
          content,
          groupId: selectedGroup.id,
          isDone: false,
        }).then(() => listTodos(selectedGroup.id));
      }
    }
  }

  // Delete a todo
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id }).then(() => {
      if (selectedGroup) {
        listTodos(selectedGroup.id);
      }
    });
  }

  // Toggle the isDone status of a todo
  function toggleTodoStatus(id: string, currentStatus: boolean) {
    client.models.Todo.update({
      id,
      isDone: !currentStatus,
    }).then(() => {
      if (selectedGroup) {
        listTodos(selectedGroup.id);
      }
    });
  }

  useEffect(() => {
    listGroups(true);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      listTodos(selectedGroup.id);
    }
  }, [selectedGroup]);

  return (
    <main className="container">
      <div className="leftDiv">
        <div>
          <h2 style={{ wordBreak: "break-word" }}>Signed in as {user?.signInDetails?.loginId}</h2>
          <button onClick={signOut}>Sign out</button>
        </div>
        <div>
          <h2>Join Groups</h2>
          <input
            type="text"
            onChange={(e) => setInputValue(e.target.value)}
            value={inputValue}
            placeholder="Enter group name"
            />
          <button onClick={joinGroup}>Join Group</button>
        </div>
        <h2>My Groups</h2>
        <ul>
          {groups.map((group) => (
            <li
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              style={{
                cursor: "pointer",
                fontWeight: selectedGroup?.id === group.id ? "bold" : "normal",
                backgroundColor: selectedGroup?.id === group.id ? "rgb(204, 204, 204)" : "rgb(255, 255, 255)",
              }}
            >
              {group.groupName}
            </li>
          ))}
        </ul>
      </div>

      <div className="rightDiv">
        <h1>{selectedGroup ? `Todos for ${selectedGroup.groupName}` : "Select a group to view todos"}</h1>
        {selectedGroup && (
          <>
            <button onClick={createTodo}>+ New</button>
            <ul>
              {todos.map((todo) => (
                <li key={todo.id}>
                  <span
                    style={{
                      textDecoration: todo.isDone ? "line-through" : "none",
                      cursor: "pointer",
                    }}
                    // onClick={() => toggleTodoStatus(todo.id, todo.isDone)}
                  >
                    {todo.content}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    style={{ float: "right", marginRight: "10px" }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
