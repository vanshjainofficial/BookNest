'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function MyBooks() {
  const { user, loading, logout, refreshUser } = useAuth();
  const { data: session } = useSession();
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Call refreshUser on component mount and fetch books
  useEffect(() => {
    const initializeData = async () => {
      console.log('=== Initializing data ===');
      console.log('Testing API call...');
      
      // Test API call with authentication
      try {
        const token = localStorage.getItem('token');
        console.log('Test token:', token ? 'Found' : 'Not found');
        
        if (token) {
          const testResponse = await fetch('/api/books/my-books', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('Test API response status:', testResponse.status);
          const testData = await testResponse.json();
          console.log('Test API data:', testData);
        } else {
          console.log('No token found for test API call');
        }
      } catch (error) {
        console.error('Test API error:', error);
      }
      
      await refreshUser();
      // Wait a bit for user data to load
      setTimeout(() => {
        console.log('User after timeout:', user);
        if (user) {
          fetchBooks();
        }
      }, 1500);
    };
    initializeData();
  }, []);

  // Auto-refresh books every 30 seconds (disabled for now to prevent multiple calls)
  // useEffect(() => {
  //   if (user) {
  //     const interval = setInterval(() => {
  //       fetchBooks();
  //     }, 30000);

  //     return () => clearInterval(interval);
  //   }
  // }, [user]);

  useEffect(() => {
    if (user) {
      console.log('User changed, fetching books:', user);
      console.log('User ID:', user.id);
      console.log('User books:', user.books);
      fetchBooks();
    } else {
      console.log('No user, setting empty books');
      setBooks([]);
      setLoadingBooks(false);
    }
  }, [user]);

  // Also fetch books when session changes
  useEffect(() => {
    if (session?.user && user?.isGoogleUser) {
      console.log('Session changed, fetching books:', session.user);
      fetchBooks();
    }
  }, [session, user]);

  const fetchBooks = async () => {
    console.log('=== fetchBooks called ===');
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('User books:', user?.books);
    console.log('Is Google User:', user?.isGoogleUser);
    
    try {
      if (!user) {
        console.log('No user found');
        setLoadingBooks(false);
        return;
      }

      // For NextAuth users, fetch from API to get fresh data
      if (user.isGoogleUser) {
        console.log('NextAuth user - fetching books from API');
        try {
          const response = await fetch('/api/books/my-books');
          console.log('NextAuth API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('NextAuth API data:', data);
            setBooks(data.books || []);
          } else {
            // Fallback to session data
            console.log('API failed, using session data');
            const ownedBooks = (user.books || []).filter(book => {
              console.log('Checking book:', book.title, 'ownerId:', book.ownerId, 'user.id:', user.id);
              return book.ownerId === user.id;
            });
            console.log('Owned books from session:', ownedBooks);
            setBooks(ownedBooks);
          }
        } catch (apiError) {
          console.error('NextAuth API error:', apiError);
          // Fallback to session data
          const ownedBooks = (user.books || []).filter(book => {
            console.log('Checking book:', book.title, 'ownerId:', book.ownerId, 'user.id:', user.id);
            return book.ownerId === user.id;
          });
          console.log('Owned books from session (fallback):', ownedBooks);
          setBooks(ownedBooks);
        }
        setLoadingBooks(false);
        return;
      }

      // For JWT users
      const token = localStorage.getItem('token');
      console.log('JWT token:', token ? 'Found' : 'Not found');
      if (!token) {
        console.log('No JWT token found, setting empty books');
        setBooks([]);
        setLoadingBooks(false);
        return;
      }

      console.log('Fetching books from API...');
      const response = await fetch('/api/books/my-books', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          console.log('401 error - session expired');
          toast.error('Session expired. Please login again.');
          logout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API data:', data);
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books');
    } finally {
      setLoadingBooks(false);
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    await fetchBooks();
    setTimeout(() => setIsRefreshing(false), 1000);
  };


  const handleEdit = (book) => {
    setEditingBook(book);
    setEditFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      condition: book.condition,
      description: book.description,
      coverImage: book.coverImage,
      isbn: book.isbn || '',
      publishedYear: book.publishedYear || '',
      language: book.language || 'English',
      pageCount: book.pageCount || '',
      tags: book.tags ? book.tags.join(', ') : ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (session?.user) {
        // For NextAuth users, no token needed
        response = await fetch(`/api/books/${editingBook._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...editFormData,
            tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()) : []
          })
        });
      } else {
        // For JWT users, use token
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to edit book');
          return;
        }

        response = await fetch(`/api/books/${editingBook._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...editFormData,
            tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()) : []
          })
        });
      }

      if (response.ok) {
        toast.success('Book updated successfully!');
        setEditingBook(null);
        setEditFormData({});
        fetchBooks();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('Failed to update book');
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      let response;
      
      if (session?.user) {
        // For NextAuth users, no token needed
        console.log('Deleting book (NextAuth):', bookId);
        response = await fetch(`/api/books/${bookId}`, {
          method: 'DELETE'
        });
      } else {
        // For JWT users, use token
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to delete book');
          return;
        }

        console.log('Deleting book (JWT):', bookId);
        response = await fetch(`/api/books/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      console.log('Delete response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete book');
      }

      const data = await response.json();
      console.log('Delete success:', data);
      toast.success('Book deleted successfully!');
      
      // Remove book from local state immediately
      setBooks(books.filter(book => book._id !== bookId));
      
      // Also refresh from server
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your books.</p>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Shared Navigation */}
      <Navbar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  📚 My Book Collection
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage your personal library and discover new reading adventures
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={manualRefresh}
                  disabled={isRefreshing}
                  className="px-6 py-3 bg-white/60 backdrop-blur-md text-gray-700 rounded-xl shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {isRefreshing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Refreshing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </div>
                  )}
                </button>
                <Link
                  href="/add-book"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 inline-block text-center"
                >
                  + Add New Book
                </Link>
              </div>
            </div>
          </div>
        </div>


        {/* Books Grid */}
        {loadingBooks ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your books...</p>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div key={book._id} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="relative">
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-6xl">📚</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                      book.status === 'available' 
                        ? 'bg-green-100/80 text-green-800 border-green-200'
                        : 'bg-yellow-100/80 text-yellow-800 border-yellow-200'
                    }`}>
                      {book.status === 'available' ? '✅ Available' : '🔄 In Exchange'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {book.genre}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {book.condition}
                    </span>
                  </div>
                  
                  {book.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{book.description}</p>
                  )}
                  
                  {book.exchangePreference && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 text-sm">
                        <span className="font-medium">Looking for:</span> {book.exchangePreference}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(book._id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-12 mx-auto max-w-md">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Books Yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your collection by adding your first book!
              </p>
              <p className="text-sm text-gray-500 mb-8">
                If you just added a book, try refreshing the page.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={manualRefresh}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
                >
                  🔄 Refresh Page
                </button>
                <Link
                  href="/add-book"
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center space-x-2">
                    <span className="text-xl">📖</span>
                    <span>Add Your First Book</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Edit Book Modal */}
        {editingBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Book</h2>
                  <button
                    onClick={() => {
                      setEditingBook(null);
                      setEditFormData({});
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Book Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.title || ''}
                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="Enter book title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.author || ''}
                        onChange={(e) => setEditFormData({...editFormData, author: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="Enter author name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Genre *
                      </label>
                      <select
                        required
                        value={editFormData.genre || ''}
                        onChange={(e) => setEditFormData({...editFormData, genre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      >
                        <option value="">Select Genre</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Romance">Romance</option>
                        <option value="Science Fiction">Science Fiction</option>
                        <option value="Fantasy">Fantasy</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Biography">Biography</option>
                        <option value="History">History</option>
                        <option value="Self-Help">Self-Help</option>
                        <option value="Business">Business</option>
                        <option value="Health">Health</option>
                        <option value="Travel">Travel</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Art">Art</option>
                        <option value="Poetry">Poetry</option>
                        <option value="Drama">Drama</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Horror">Horror</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Children">Children</option>
                        <option value="Young Adult">Young Adult</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition *
                      </label>
                      <select
                        required
                        value={editFormData.condition || ''}
                        onChange={(e) => setEditFormData({...editFormData, condition: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      >
                        <option value="">Select Condition</option>
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={editFormData.coverImage || ''}
                      onChange={(e) => setEditFormData({...editFormData, coverImage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                      placeholder="Describe the book..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium"
                    >
                      Update Book
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBook(null);
                        setEditFormData({});
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}