"use client"

import Navbar from "@/app/navbar";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/app/apiClient";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink, PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type User = {
  userId: number;
  username: string;
}

type Profile = {
  user: User;
  avatar: string;
  firstname: string;
  lastname: string;
}

type OriginalPost = {
  postId: number;
  profile: Profile;
  postContent: string;
  timestamp: string;
}

/* Define TypeScript type for a Post object returned by API */
type Post = {
  postId: number;
  profile: Profile;
  postContent: string;
  timestamp: string;
  like: number;
  originalPost: OriginalPost;
}

/* Define TypeScript type for a Thread object returned by API */
type Thread = {
  threadId: number;
  profile: Profile;
  threadName: string;
  timestamp: string;
  threadContent: string;
  like: number;
}

// Export the default page component rendered at the /posts/[id] route
export default function Page() {
  const params = useParams();
  // State to hold the current page
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State to hold the total pages
  const [totalPages, setTotalPages] = useState<number>(1);

  // State variable to hold the fetched post details
  const [posts, setPosts] = useState<Post[]>([]);

  // State to hold the fetched Thread
  const [thread, setThread] = useState<Thread>();

  const [postContent, setPostContent] = useState("");

  const [isCreatingPost, setIsCreatingPost] = useState<number[]>([]);

  const { push } = useRouter();

  // State to hold the user
  const [user, setUser] = useState<User | null>(null);

  // Get current logged in information
  async function fetchUser() {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token && !refreshToken) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/current_user");
      console.log(response);
      setUser(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
          return;
        }
      }

      console.error(error);
    }
  }

  // Async function to fetch thread from API

  // Async function to fetch thread from API
  async function fetchThread() {
    try {
      // Send a Get request to the Get Thread endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/threads/" + params.id, {
        headers: {
          "Accept": 'application/json'
        }
      });
      // console.log(response);
      setThread(response.data);      // Store the returned thread data in state
    } catch (error) {
      console.error(error);         // Log network or server error to the console
    }
  }

  // Async function to fetch posts 
  async function fetchPosts(page: number = 1) {
    if (page >= 1) {
      setCurrentPage(page);
    }
    try {
      // Send a Get request to the Get Posts endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/threads/" + params.id + "/posts", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: 1,      // Request the first page of result
          size: 20,     // Limit results to 20 posts
        }
      });
      if (response && response.data) {
        // Extract the items array from the paginated response and store it in state
        setPosts(response.data.items);
      }
    } catch (error) {
      console.error(error);   // Log error to the console
    }
  }

  // Async function to create a post 
  async function createPost(originalPostId: string | null = null) {
    try {
      // Send a GET resquest to the search threads endpoint using the id from the URL
      const response = await api.post("/threads/" + params.id + "/posts", {
        postContent,
        originalPostId,
      });
      setIsCreatingPost([]);
      setPostContent("");
      fetchPosts(totalPages).then(() => {
        push('/discussions/' + params.id + "#" + response.data.postId);
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Triggers both data fetching function on page load
  useEffect(() => {
    fetchThread();               // Fetch movie
    fetchPosts();
    fetchUser();
  }, []);


  // Render the discussion forum page UI
  return (
    // Outer container
    <div className="mx-auto">
      {/* Render the navigation bar at the top of the page*/}
      <Navbar />
      {thread && (
        <div>
          <div className="mt-3 mx-3 font-bold text-2xl">
            {thread.threadName}
          </div>
          <Table className="w-full border-separate border-spacing-y-15 px-3">
            <TableBody>
              <TableRow className="">
                <TableCell className="flex flex-col border-1 border-gray-400 p-0">
                  <div className="flex gap-5 bg-muted">
                    <Link href={"/threads/" + thread.threadId} className="h-20 w-20">
                      <img src={thread.profile.avatar} alt={thread.profile.user.username}
                        className="h-full w-full object-cover" />
                    </Link>

                    <div className="flex flex-col">
                      <div className="font-bold text-lg">
                        Original Post
                      </div>
                      <div className="">Posted by {thread.profile.user.username}</div>
                      <div className="mr-9">on {thread.timestamp}</div>
                    </div>
                  </div>

                  <div className="py-5 px-2 whitespace-normal ">
                    <span dangerouslySetInnerHTML={{ __html: thread.threadContent }}></span>
                  </div>

                  <div className="flex items-center gap-2 p-2 border-t-1 border-gray-400">
                    <ThumbsUp /> <span className="font-bold mr-3">{thread.like}</span>
                    {user != null && !isCreatingPost.includes(0) && (
                      <Button variant="secondary"
                        onClick={e => setIsCreatingPost([0])}>
                        Reply
                      </Button>
                    )}
                  </div>

                  {user != null && isCreatingPost.includes(0) && (
                    <div className="flex items-center gap-2 p-2 border-t-1 border-gray-400">
                      <div className="flex flex-col gap-7">
                        <RichTextEditor className="bg-white"
                          value={postContent}
                          onChange={value => setPostContent(value)} />
                        <div className="flex gap-5">
                          <Button className="bg-orange-400 hover:bg-orange-800 w-50"
                            disabled={!postContent}
                            onClick={e => createPost()}>
                            Post Reply
                          </Button>
                          <Button variant="secondary" className="w-50"
                            onClick={e => setIsCreatingPost([])}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>

              {posts.map(post => (
                <TableRow key={post.postId} className="">
                  <TableCell className="flex flex-col border-1 border-gray-400 p-0">
                    <div className="flex gap-5 bg-muted">
                      <Link href={"/threads/" + post.postId} className="h-20 w-20">
                        <img src={post.profile.avatar} alt={post.profile.user.username}
                          className="h-full w-full object-cover" />
                      </Link>

                      <div className="mx-2 w-full flex justify-between">
                        <div className="flex flex-col" id={String(post.postId)}>

                          <Link className="font-bold text-lg" href={"#" + post.postId}>
                            Reply by {post.profile.user.username}
                          </Link>
                          <div className="mr-9">on {post.timestamp}</div>
                        </div>
                        <div>
                          #{post.postId}
                        </div>
                      </div>
                    </div>

                    <div className="py-5 px-2 whitespace-normal ">

                      {post.originalPost && (
                        <div className="flex flex-col py-5 px-2 mb-5 whitespace-normal border-1 border-gray-500">
                          <span className="font-semibold mb-2">
                            @{post.originalPost.profile.user.username} said:
                          </span>
                          <span dangerouslySetInnerHTML={{ __html: post.originalPost.postContent }}></span>
                        </div>
                      )}

                      <span dangerouslySetInnerHTML={{ __html: post.postContent }}></span>
                    </div>

                    <div className="flex items-center gap-2 p-2 border-t-1 border-gray-400">
                      <ThumbsUp /> <span className="font-bold mr-3">{post.like}</span>
                      {user != null && !isCreatingPost.includes(post.postId) && (
                        <Button variant="secondary"
                          onClick={e => setIsCreatingPost([post.postId])}>
                          Reply
                        </Button>
                      )}
                    </div>

                    {user != null && isCreatingPost.includes(post.postId) && (
                      <div className="flex items-center gap-2 p-2 border-t-1 border-gray-400">
                        <div className="flex flex-col gap-7">
                          <RichTextEditor className="bg-white"
                            value={postContent}
                            onChange={value => setPostContent(value)} />
                          <div className="flex gap-5">
                            <Button className="bg-orange-400 hover:bg-orange-800 w-50"
                              disabled={!postContent}
                              onClick={e => createPost(String(post.postId))}>
                              Post Reply
                            </Button>
                            <Button variant="secondary" className="w-50"
                              onClick={e => setIsCreatingPost([])}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>

          <Pagination className="mt-15 mb-10">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" aria-disabled={currentPage <= 1}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={() => fetchPosts(currentPage - 1)} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink href="#"
                    isActive={page === currentPage} onClick={() => fetchPosts(page)}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" aria-disabled={currentPage >= totalPages}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  onClick={() => fetchPosts(currentPage + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}